const defaultSubmitButtonText = 'Connect with LoyaltyLion'
const successSubmitButtonText = 'Integration successfully created!'
const errorSubmitButtonText = 'There was an error creating the integration, please try again later.'

function onSubmit(event) {
    event.preventDefault()

    let submitButton = document.querySelector('#connectButton')
    submitButton.classList.add('disabled')

    // Fill in data that needs to be changed in HTTP integration payload
    const loyaltyLionAPIToken = document.querySelector('#loyaltyLionAPIToken').value
    const loyaltyLionAPISecret = document.querySelector('#loyaltyLionAPISecret').value
    const authHeader = btoa(`${loyaltyLionAPIToken}:${loyaltyLionAPISecret}`)

    const httpIntegrationPayload = {
        'type': 'http',
        'name': 'LoyaltyLion',
        'description': 'Fetches data from LoyaltyLion and displays it next to tickets.',
        'http': {
            'headers': {
                'Authorization': `Basic ${authHeader}`
            },
            'url': 'https://api.loyaltylion.com/v2/customers?email={{ticket.requester.email}}',
            'method': 'GET',
            'request_content_type': 'application/json',
            'response_content_type': 'application/json',
            'triggers': {
                'ticket-created': true,
                'ticket-updated': false,
                'ticket-message-created': true
            }
        }
    }

    const widgetTemplate = {
        context: 'ticket',
        type: 'http',
        order: 0,
        template: {
            'type': 'wrapper',
            'widgets': [
                {
                    'meta': {
                        'limit': '',
                        'orderBy': ''
                    },
                    'path': 'customers',
                    'type': 'list',
                    'widgets': [
                        {
                            'meta': {
                                'link': '',
                                'displayCard': true
                            },
                            'type': 'card',
                            'title': 'LoyaltyLion',
                            'widgets': [
                                {
                                    'path': 'loyalty_tier_membership',
                                    'type': 'text',
                                    'order': 0,
                                    'title': 'Loyalty tier membership'
                                },
                                {
                                    'path': 'points_approved',
                                    'type': 'text',
                                    'order': 1,
                                    'title': 'Points approved'
                                },
                                {
                                    'path': 'points_pending',
                                    'type': 'text',
                                    'order': 2,
                                    'title': 'Points pending'
                                },
                                {
                                    'path': 'points_spent',
                                    'type': 'text',
                                    'order': 3,
                                    'title': 'Points spent'
                                },
                                {
                                    'path': 'rewards_claimed',
                                    'type': 'text',
                                    'order': 4,
                                    'title': 'Rewards claimed'
                                },
                                {
                                    'path': 'birthday',
                                    'type': 'age',
                                    'order': 5,
                                    'title': 'Birthday'
                                },
                                {
                                    'path': 'created_at',
                                    'type': 'date',
                                    'order': 6,
                                    'title': 'Created at'
                                },
                                {
                                    'path': 'enrolled_at',
                                    'type': 'date',
                                    'order': 7,
                                    'title': 'Enrolled at'
                                },
                                {
                                    'path': 'blocked',
                                    'type': 'boolean',
                                    'order': 8,
                                    'title': 'Blocked'
                                },
                                {
                                    'path': 'enrolled',
                                    'type': 'boolean',
                                    'order': 9,
                                    'title': 'Enrolled'
                                },
                                {
                                    'path': 'guest',
                                    'type': 'boolean',
                                    'order': 10,
                                    'title': 'Guest'
                                },
                                {
                                    'path': 'insights_segment',
                                    'type': 'text',
                                    'order': 11,
                                    'title': 'Insights segment'
                                },
                                {
                                    'path': 'referral_url',
                                    'type': 'url',
                                    'order': 12,
                                    'title': 'Referral url'
                                },
                                {
                                    'path': 'referred_by',
                                    'type': 'text',
                                    'order': 13,
                                    'title': 'Referred by'
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }

    const payload = {
        gorgiasEmail: document.querySelector('#gorgiasEmail').value,
        gorgiasDomain: document.querySelector('#gorgiasDomain').value,
        gorgiasAPIKey: document.querySelector('#gorgiasAPIKey').value,
        httpIntegrationPayload,
        widgetTemplate
    }

    const url = `https://us-central1-gorgias-apps-cloud-functions.cloudfunctions.net/app-form-redirect`

    let config = {
        method: 'POST',
        body: JSON.stringify(payload),
        redirect: 'follow',
        headers: {
            'Content-Type': 'application/json',
        }
    }

    function handleError(err) {
        console.error('error:' + err)
        submitButton.classList.remove('disabled')
        submitButton.classList.remove('btn-info')
        submitButton.classList.add('btn-danger')
        submitButton.innerHTML = errorSubmitButtonText
    }

    fetch(url, config)
        .then((resp) => {
            if (resp.status > 399) {
                handleError(`status code: ${resp.status}; response: ${resp.body}`)
            } else {
                submitButton.classList.remove('disabled')
                submitButton.classList.remove('btn-info')
                submitButton.classList.add('btn-success')
                submitButton.innerHTML = successSubmitButtonText
            }
        })
        .catch(handleError)
        .then(() => {
            setTimeout(() => {
                submitButton.classList.remove('disabled')
                submitButton.classList.remove('btn-success')
                submitButton.classList.remove('btn-danger')
                submitButton.classList.add('btn-info')
                submitButton.innerHTML = defaultSubmitButtonText
            }, 3000)
        })

    return false
}
