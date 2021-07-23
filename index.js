const defaultSubmitButtonText = 'Connect with LoyaltyLion'
const successSubmitButtonText = 'Integration successfully created!'
const errorSubmitButtonText = 'There was an error creating the integration, please try again later.'

function onSubmit(event) {
    event.preventDefault()

    let submitButton = document.querySelector('#connectButton')
    submitButton.classList.add('disabled')
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

    const url = `https://us-central1-gorgias-apps-cloud-functions.cloudfunctions.net/app-form-redirect`

    let rawPayload = JSON.stringify(payload)

    let requestOptions = {
        method: 'POST',
        body: rawPayload,
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
        submitButton.innerHTML = errorSubmitButtonText;
    }

    fetch(url, requestOptions)
        .then((resp) => {
            if (resp.status > 399) {
                handleError(`status code: ${resp.status}; response: ${resp.body}`)
            } else {
                submitButton.classList.remove('disabled')
                submitButton.classList.remove('btn-info')
                submitButton.classList.add('btn-success')
                submitButton.innerHTML = successSubmitButtonText;
            }
        })
        .catch(handleError)
        .then(() => {
            setTimeout(() => {
                submitButton.classList.remove('disabled')
                submitButton.classList.remove('btn-success')
                submitButton.classList.remove('btn-danger')
                submitButton.classList.add('btn-info')
                submitButton.innerHTML = defaultSubmitButtonText;
            }, 3000)
        })

    return false
}
