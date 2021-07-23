document.addEventListener('DOMContentLoaded', () => {
    let submitButton = document.querySelector('#connectButton')

    submitButton.addEventListener('click', () => {
        const httpIntegrationPayload = {
            "type": "http",
            "name": "LoyaltyLion",
            "description": "Fetches data from LoyaltyLion and displays it next to tickets.",
            "http": {
                "headers": {
                    "Authorization": "Basic {loyaltyLionAPIKey}"
                },
                "url": "https://api.loyaltylion.com/v2/customers?email={{ticket.requester.email}}",
                "method": "GET",
                "request_content_type": "application/json",
                "response_content_type": "application/json",
                "triggers": {
                    "ticket-created": true,
                    "ticket-updated": false,
                    "ticket-message-created": true
                }
            }
        }

        const widgetTemplate = {context: "ticket", order: 0}  // FIXME

        const payload = {
            gorgiasEmail: document.querySelector('#gorgiasEmail').value,
            gorgiasDomain: document.querySelector('#gorgiasDomain').value,
            gorgiasAPIKey: document.querySelector('#gorgiasAPIKey').value,
            httpIntegrationPayload,
            widgetTemplate
        }

        // Fill in data that needs to be changed in HTTP integration payload
        const loyaltyLionEmail = document.querySelector('#loyaltyLionEmail').value;
        const loyaltyLionAPIKey = document.querySelector('#loyaltyLionAPIKey').value;
        payload.httpIntegrationPayload.http.headers.Authorization.replace('{loyaltyLionAPIKey}', loyaltyLionAPIKey)

        console.log('', dataObject.gorgiasDomain)

        const url = `https://${domain}.gorgias.com/api/integrations`

        let rawPayload = JSON.stringify(payload)

        let requestOptions = {
            method: 'POST',
            body: rawPayload,
            redirect: 'follow'
        }

        return fetch(url, requestOptions)
            .catch(err => {
                isError = true
                console.error('error:' + err)
            })
    })
})
