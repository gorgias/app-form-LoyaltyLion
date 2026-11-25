'use strict'

const LOYALTYLION_CUSTOMERS_URL =
    'https://api.loyaltylion.com/v2/customers?email={{ticket.customer.email}}'

function loyaltyLionAuthorization({ loyaltyLionAPIKey }) {
    return `Bearer ${loyaltyLionAPIKey}`
}

function buildIntegrationPayload(credentials) {
    return {
        type: 'http',
        name: 'LoyaltyLion',
        description: 'Fetches data from LoyaltyLion and displays it next to tickets.',
        http: {
            headers: {
                Authorization: loyaltyLionAuthorization(credentials)
            },
            url: LOYALTYLION_CUSTOMERS_URL,
            method: 'GET',
            request_content_type: 'application/json',
            response_content_type: 'application/json',
            triggers: {
                'ticket-created': true,
                'ticket-updated': false,
                'ticket-message-created': true
            }
        }
    }
}

function field(path, type, order, title) {
    return { path, type, order, title }
}

const WIDGET_TEMPLATE = deepFreeze({
    context: 'ticket',
    type: 'http',
    order: 0,
    template: {
        type: 'wrapper',
        widgets: [
            {
                meta: {
                    limit: '',
                    orderBy: ''
                },
                path: 'customers',
                type: 'list',
                widgets: [
                    {
                        meta: {
                            link: '',
                            displayCard: true
                        },
                        type: 'card',
                        title: 'LoyaltyLion',
                        widgets: [
                            field('loyalty_tier_membership', 'text', 0, 'Loyalty tier membership'),
                            field('points_approved', 'text', 1, 'Points approved'),
                            field('points_pending', 'text', 2, 'Points pending'),
                            field('points_spent', 'text', 3, 'Points spent'),
                            field('rewards_claimed', 'text', 4, 'Rewards claimed'),
                            field('birthday', 'age', 5, 'Birthday'),
                            field('created_at', 'date', 6, 'Created at'),
                            field('enrolled_at', 'date', 7, 'Enrolled at'),
                            field('blocked', 'boolean', 8, 'Blocked'),
                            field('enrolled', 'boolean', 9, 'Enrolled'),
                            field('guest', 'boolean', 10, 'Guest'),
                            field('insights_segment', 'text', 11, 'Insights segment'),
                            field('referral_url', 'url', 12, 'Referral url'),
                            field('referred_by', 'text', 13, 'Referred by')
                        ]
                    }
                ]
            }
        ]
    }
})

function buildWidgetPayload(integrationId) {
    return { ...structuredClone(WIDGET_TEMPLATE), integration_id: integrationId }
}

function deepFreeze(value) {
    for (const child of Object.values(value)) {
        if (child && typeof child === 'object') deepFreeze(child)
    }
    return Object.freeze(value)
}

module.exports = {
    buildIntegrationPayload,
    buildWidgetPayload,
    loyaltyLionAuthorization,
    WIDGET_TEMPLATE
}
