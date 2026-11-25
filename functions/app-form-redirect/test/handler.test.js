'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { createHandler } = require('../lib/handler')
const { buildIntegrationPayload, WIDGET_TEMPLATE } = require('../lib/payloads')

const API_KEY = 'gorgias-api-key-123'
const LL_API_KEY = 'loyaltylion-api-key-456'

function validBody(overrides = {}) {
    return {
        gorgiasDomain: 'acme',
        gorgiasEmail: 'me@acme.com',
        gorgiasAPIKey: API_KEY,
        loyaltyLionAPIKey: LL_API_KEY,
        ...overrides
    }
}

function fakeFetch(...responses) {
    const calls = []
    const fn = async (url, init) => {
        calls.push({ url, init })
        const next = responses.shift()
        if (next instanceof Error) throw next
        if (!next) throw new Error('unexpected fetch call')
        return next
    }
    fn.calls = calls
    return fn
}

function jsonResponse(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    })
}

function fakeLog() {
    const lines = []
    const record = (...args) => lines.push(args.map(String).join(' '))
    return { lines, log: record, info: record, warn: record, error: record }
}

function fakeRes() {
    return {
        statusCode: undefined,
        headers: {},
        body: undefined,
        status(code) {
            this.statusCode = code
            return this
        },
        set(name, value) {
            this.headers[name] = value
            return this
        },
        send(body) {
            this.body = body
            return this
        },
        json(body) {
            this.body = body
            return this
        }
    }
}

async function call({ method = 'POST', body, fetch = fakeFetch(), log = fakeLog() } = {}) {
    const res = fakeRes()
    await createHandler({ fetch, log })({ method, headers: {}, body }, res)
    return { res, fetch, log }
}

test('OPTIONS returns 204 with CORS headers for gorgias.github.io', async () => {
    const { res, fetch } = await call({ method: 'OPTIONS' })

    assert.equal(res.statusCode, 204)
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://gorgias.github.io')
    assert.match(res.headers['Access-Control-Allow-Methods'], /POST/)
    assert.match(res.headers['Access-Control-Allow-Headers'], /Content-Type/)
    assert.equal(fetch.calls.length, 0)
})

test('GET returns 405', async () => {
    const { res, fetch } = await call({ method: 'GET' })

    assert.equal(res.statusCode, 405)
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://gorgias.github.io')
    assert.equal(fetch.calls.length, 0)
})

test('rejects missing fields with 400 and makes no outbound call', async () => {
    for (const field of ['gorgiasDomain', 'gorgiasEmail', 'gorgiasAPIKey', 'loyaltyLionAPIKey']) {
        const body = validBody()
        delete body[field]
        const { res, fetch } = await call({ body })

        assert.equal(res.statusCode, 400, field)
        assert.equal(fetch.calls.length, 0, field)
    }
})

test('rejects empty, non-string and oversized fields with 400', async () => {
    const cases = [
        undefined,
        null,
        'not json',
        [],
        validBody({ gorgiasAPIKey: '   ' }),
        validBody({ loyaltyLionAPIKey: 123 }),
        validBody({ loyaltyLionAPIKey: 'x'.repeat(257) }),
        validBody({ gorgiasEmail: 'not-an-email' }),
        validBody({ gorgiasEmail: 'a b@acme.com' })
    ]
    for (const body of cases) {
        const { res, fetch } = await call({ body })

        assert.equal(res.statusCode, 400, JSON.stringify(body))
        assert.equal(fetch.calls.length, 0, JSON.stringify(body))
    }
})

test('rejects host-injection domains with 400', async () => {
    const domains = [
        'evil.com/',
        'a.b',
        'acme.gorgias.com',
        'x#',
        'x?y',
        '-acme',
        'acme-',
        'a'.repeat(64),
        '169.254.169.254',
        'user@evil.com',
        'acme:443',
        ''
    ]
    for (const gorgiasDomain of domains) {
        const { res, fetch } = await call({ body: validBody({ gorgiasDomain }) })

        assert.equal(res.statusCode, 400, gorgiasDomain)
        assert.equal(fetch.calls.length, 0, gorgiasDomain)
    }
})

test('accepts a JSON string body', async () => {
    const fetch = fakeFetch(jsonResponse(201, { id: 1 }), jsonResponse(201, { id: 2 }))
    const { res } = await call({ body: JSON.stringify(validBody()), fetch })

    assert.equal(res.statusCode, 201)
})

test('normalizes domain', async () => {
    const fetch = fakeFetch(jsonResponse(201, { id: 1 }), jsonResponse(201, { id: 2 }))
    await call({ body: validBody({ gorgiasDomain: '  AcMe ' }), fetch })

    assert.equal(fetch.calls[0].url, 'https://acme.gorgias.com/api/integrations/')
})

test('happy path creates integration then widget', async () => {
    const fetch = fakeFetch(jsonResponse(201, { id: 42 }), jsonResponse(201, { id: 7 }))
    const { res } = await call({ body: validBody(), fetch })

    assert.equal(fetch.calls.length, 2)
    const expectedAuth = 'Basic ' + Buffer.from(`me@acme.com:${API_KEY}`).toString('base64')

    const [integration, widget] = fetch.calls
    assert.equal(integration.url, 'https://acme.gorgias.com/api/integrations/')
    assert.equal(integration.init.method, 'POST')
    assert.equal(integration.init.headers.Authorization, expectedAuth)
    assert.equal(integration.init.headers['Content-Type'], 'application/json')
    assert.equal(integration.init.redirect, 'error')
    assert.ok(integration.init.signal instanceof AbortSignal)
    assert.deepEqual(
        JSON.parse(integration.init.body),
        buildIntegrationPayload({ loyaltyLionAPIKey: LL_API_KEY })
    )

    assert.equal(widget.url, 'https://acme.gorgias.com/api/widgets/')
    assert.equal(widget.init.method, 'POST')
    assert.equal(widget.init.headers.Authorization, expectedAuth)
    assert.equal(widget.init.redirect, 'error')
    const widgetBody = JSON.parse(widget.init.body)
    assert.equal(widgetBody.integration_id, 42)
    assert.equal(widgetBody.context, 'ticket')
    assert.equal(widgetBody.type, 'http')
    assert.deepEqual(widgetBody.template, WIDGET_TEMPLATE.template)

    assert.equal(res.statusCode, 201)
    assert.deepEqual(res.body, { integrationId: 42 })
    assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://gorgias.github.io')
})

test('integration 401 returns 401 and skips widget', async () => {
    const fetch = fakeFetch(jsonResponse(401, { error: 'unauthorized' }))
    const { res } = await call({ body: validBody(), fetch })

    assert.equal(res.statusCode, 401)
    assert.equal(fetch.calls.length, 1)
})

test('integration 5xx returns 502 and skips widget', async () => {
    const fetch = fakeFetch(jsonResponse(500, {}))
    const { res } = await call({ body: validBody(), fetch })

    assert.equal(res.statusCode, 502)
    assert.equal(fetch.calls.length, 1)
})

test('integration response without id returns 502 and skips widget', async () => {
    const fetch = fakeFetch(jsonResponse(201, {}))
    const { res } = await call({ body: validBody(), fetch })

    assert.equal(res.statusCode, 502)
    assert.equal(fetch.calls.length, 1)
})

test('widget failure returns 502', async () => {
    const fetch = fakeFetch(jsonResponse(201, { id: 42 }), jsonResponse(400, { error: 'bad' }))
    const { res } = await call({ body: validBody(), fetch })

    assert.equal(res.statusCode, 502)
    assert.equal(fetch.calls.length, 2)
})

test('fetch throws (timeout) returns 502', async () => {
    const timeout = new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    const fetch = fakeFetch(timeout)
    const { res } = await call({ body: validBody(), fetch })

    assert.equal(res.statusCode, 502)
    assert.equal(fetch.calls.length, 1)
})

test('never logs secrets', async () => {
    const scenarios = [
        [jsonResponse(201, { id: 42 }), jsonResponse(201, { id: 7 })],
        [jsonResponse(401, { error: 'unauthorized' })],
        [jsonResponse(201, { id: 42 }), jsonResponse(400, { error: 'bad' })],
        [new TypeError(`fetch failed for ${API_KEY} ${LL_API_KEY}`)]
    ]
    for (const responses of scenarios) {
        const log = fakeLog()
        await call({ body: validBody(), fetch: fakeFetch(...responses), log })

        assert.ok(log.lines.length > 0)
        for (const line of log.lines) {
            assert.ok(!line.includes(API_KEY), line)
            assert.ok(!line.includes(LL_API_KEY), line)
            assert.ok(!line.includes('Basic '), line)
            assert.ok(!line.includes('Bearer '), line)
        }
    }
})
