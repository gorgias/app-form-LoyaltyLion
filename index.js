const defaultSubmitButtonText = 'Connect with LoyaltyLion'
const successSubmitButtonText = 'Integration successfully created!'
const errorSubmitButtonText = 'There was an error creating the integration, please try again later.'
const invalidCredentialsSubmitButtonText = 'Invalid Gorgias email, domain or API key, please check them and try again.'
const invalidInputSubmitButtonText = 'Some fields are invalid, please check them and try again.'

const url = 'https://us-central1-gorgias-apps-cloud-functions.cloudfunctions.net/app-form-loyaltylion'

function onSubmit(event) {
    event.preventDefault()

    let submitButton = document.querySelector('#connectButton')
    submitButton.classList.add('disabled')

    const payload = {
        gorgiasEmail: document.querySelector('#gorgiasEmail').value,
        gorgiasDomain: document.querySelector('#gorgiasDomain').value,
        gorgiasAPIKey: document.querySelector('#gorgiasAPIKey').value,
        loyaltyLionAPIKey: document.querySelector('#loyaltyLionAPIKey').value
    }

    let config = {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
        }
    }

    function handleError(err, message = errorSubmitButtonText) {
        console.error('error:' + err)
        submitButton.classList.remove('btn-info')
        submitButton.classList.add('btn-danger')
        submitButton.innerHTML = message

        setTimeout(() => {
            submitButton.classList.remove('disabled')
            submitButton.classList.remove('btn-success')
            submitButton.classList.remove('btn-danger')
            submitButton.classList.add('btn-info')
            submitButton.innerHTML = defaultSubmitButtonText
        }, 3000)
    }

    fetch(url, config)
        .then((resp) => {
            if (resp.status === 401) {
                handleError(`status code: ${resp.status}`, invalidCredentialsSubmitButtonText)
            } else if (resp.status === 400) {
                handleError(`status code: ${resp.status}`, invalidInputSubmitButtonText)
            } else if (resp.status > 399) {
                handleError(`status code: ${resp.status}`)
            } else {
                submitButton.classList.remove('btn-info')
                submitButton.classList.add('btn-success')
                submitButton.innerHTML = successSubmitButtonText
            }
        })
        .catch(handleError)

    return false
}
