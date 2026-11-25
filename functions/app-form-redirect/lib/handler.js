'use strict'

const { buildIntegrationPayload, buildWidgetPayload } = require('./payloads')

const ALLOWED_ORIGIN = 'https://gorgias.github.io'
const DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_FIELD_LENGTH = 256
const UPSTREAM_TIMEOUT_MS = 10000

function isBoundedString(value) {
    return (
        typeof value === 'string' &&
        value.trim().length > 0 &&
        value.length <= MAX_FIELD_LENGTH
    )
}

function parseBody(body) {
    if (typeof body === 'string') {
        try {
            return JSON.parse(body)
        } catch {
            return null
        }
    }
    return body
}

function parseInput(rawBody) {
    const body = parseBody(rawBody)
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null

    const { gorgiasDomain, gorgiasEmail, gorgiasAPIKey, loyaltyLionAPIKey } = body
    if (![gorgiasDomain, gorgiasEmail, gorgiasAPIKey, loyaltyLionAPIKey].every(isBoundedString)) {
        return null
    }

    const domain = gorgiasDomain.trim().toLowerCase()
    const email = gorgiasEmail.trim()
    if (!DOMAIN_PATTERN.test(domain) || !EMAIL_PATTERN.test(email)) return null

    return {
        domain,
        email,
        apiKey: gorgiasAPIKey.trim(),
        loyaltyLionAPIKey: loyaltyLionAPIKey.trim()
    }
}

function upstreamError(status) {
    if (status === 401 || status === 403) {
        return { status: 401, body: { error: 'invalid Gorgias credentials' } }
    }
    return { status: 502, body: { error: 'Gorgias API request failed' } }
}

function createHandler({ fetch, log }) {
    function record(domain, step, status) {
        log.info(JSON.stringify({ domain, step, status }))
    }

    return async function redirect(req, res) {
        res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        res.set('Vary', 'Origin')

        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
            res.set('Access-Control-Allow-Headers', 'Content-Type')
            res.set('Access-Control-Max-Age', '3600')
            return res.status(204).send('')
        }

        if (req.method !== 'POST') {
            res.set('Allow', 'POST, OPTIONS')
            return res.status(405).json({ error: 'method not allowed' })
        }

        const input = parseInput(req.body)
        if (!input) return res.status(400).json({ error: 'invalid request' })

        const { domain } = input
        const baseUrl = `https://${domain}.gorgias.com/api`
        const authorization =
            'Basic ' + Buffer.from(`${input.email}:${input.apiKey}`).toString('base64')

        function post(path, payload) {
            return fetch(`${baseUrl}/${path}/`, {
                method: 'POST',
                headers: {
                    Authorization: authorization,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(payload),
                redirect: 'error',
                signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
            })
        }

        let step = 'integration'
        try {
            const integrationResp = await post('integrations', buildIntegrationPayload(input))
            record(domain, step, integrationResp.status)
            if (!integrationResp.ok) {
                const { status, body } = upstreamError(integrationResp.status)
                return res.status(status).json(body)
            }

            const integration = await integrationResp.json().catch(() => null)
            const integrationId = integration && integration.id
            if (!Number.isInteger(integrationId)) {
                record(domain, step, 'missing id')
                return res.status(502).json({ error: 'Gorgias API request failed' })
            }

            step = 'widget'
            const widgetResp = await post('widgets', buildWidgetPayload(integrationId))
            record(domain, step, widgetResp.status)
            if (!widgetResp.ok) {
                return res
                    .status(502)
                    .json({ error: 'widget creation failed', integrationId })
            }

            return res.status(201).json({ integrationId })
        } catch (err) {
            log.error(JSON.stringify({ domain, step, error: err && err.name }))
            return res.status(502).json({ error: 'Gorgias API request failed' })
        }
    }
}

module.exports = { createHandler, parseInput }
