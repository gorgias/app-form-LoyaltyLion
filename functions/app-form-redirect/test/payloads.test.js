'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const {
    buildIntegrationPayload,
    buildWidgetPayload,
    WIDGET_TEMPLATE
} = require('../lib/payloads')

test('integration payload uses LoyaltyLion API key bearer auth', () => {
    const payload = buildIntegrationPayload({ loyaltyLionAPIKey: 't' })

    assert.equal(payload.http.headers.Authorization, 'Bearer t')
    assert.equal(payload.type, 'http')
    assert.equal(payload.name, 'LoyaltyLion')
    assert.equal(
        payload.http.url,
        'https://api.loyaltylion.com/v2/customers?email={{ticket.customer.email}}'
    )
    assert.equal(payload.http.method, 'GET')
    assert.equal(payload.http.request_content_type, 'application/json')
    assert.equal(payload.http.response_content_type, 'application/json')
    assert.deepEqual(payload.http.triggers, {
        'ticket-created': true,
        'ticket-updated': false,
        'ticket-message-created': true
    })
})

test('integration payload ignores unrelated input fields', () => {
    const payload = buildIntegrationPayload({
        loyaltyLionAPIKey: 't',
        apiKey: 'gorgias-secret',
        email: 'me@acme.com'
    })

    assert.ok(!JSON.stringify(payload).includes('gorgias-secret'))
    assert.ok(!JSON.stringify(payload).includes('me@acme.com'))
})

test('widget template matches the current form', () => {
    assert.equal(WIDGET_TEMPLATE.context, 'ticket')
    assert.equal(WIDGET_TEMPLATE.type, 'http')
    assert.equal(WIDGET_TEMPLATE.order, 0)

    const list = WIDGET_TEMPLATE.template.widgets[0]
    assert.equal(WIDGET_TEMPLATE.template.type, 'wrapper')
    assert.equal(list.type, 'list')
    assert.equal(list.path, 'customers')

    const card = list.widgets[0]
    assert.equal(card.type, 'card')
    assert.equal(card.title, 'LoyaltyLion')
    assert.deepEqual(
        card.widgets.map((w) => [w.path, w.type, w.order]),
        [
            ['loyalty_tier_membership', 'text', 0],
            ['points_approved', 'text', 1],
            ['points_pending', 'text', 2],
            ['points_spent', 'text', 3],
            ['rewards_claimed', 'text', 4],
            ['birthday', 'age', 5],
            ['created_at', 'date', 6],
            ['enrolled_at', 'date', 7],
            ['blocked', 'boolean', 8],
            ['enrolled', 'boolean', 9],
            ['guest', 'boolean', 10],
            ['insights_segment', 'text', 11],
            ['referral_url', 'url', 12],
            ['referred_by', 'text', 13]
        ]
    )
})

test('widget payload sets integration_id without mutating the template', () => {
    const payload = buildWidgetPayload(42)

    assert.equal(payload.integration_id, 42)
    assert.deepEqual(payload.template, WIDGET_TEMPLATE.template)
    assert.equal(WIDGET_TEMPLATE.integration_id, undefined)

    payload.template.widgets.length = 0
    assert.equal(WIDGET_TEMPLATE.template.widgets.length, 1)
})
