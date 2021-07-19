document.addEventListener("DOMContentLoaded", () => {
    let submitButton = document.querySelector('#connectButton');

    const getHeaders = (email, apiKey) => {

        const authBase64Encoded = btoa(`${email}:${apiKey}`)
        const basicAuthString = `Basic ${authBase64Encoded}`

        // const headers = new Headers();
        // headers.append("Content-Type", "application/json");
        // headers.append("Accept", "application/json");
        // headers.append("Authorization", basicAuthString);

        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": basicAuthString
        }
    }

    // Authorization: 'Basic ' + btoa(email + ":" + apiKey)
    const integrationMethod = (domain, email, apiKey) => {
        const url = `https://${domain}.gorgias.com/api/integrations`; // form - gorgiasDomain

        let raw = JSON.stringify({
            "name": "My HTTP integration",
            "type": "http",
            "deactivated_datetime": "1981-08-29T23:05:17.350Z",
            "description": "sed eu officia magna",
            "http": {
                "id": 987,
                "url": "https://company.com/api/customers?email={{ticket.customer.email}}",
                "method": "GET",
                "headers": {
                    "x-api-key": "abcdef12345"
                },
                "form": {
                    "hello": "world",
                    "ticket_id": "{{ticket.id}}"
                },
                "request_content_type": "application/json",
                "response_content_type": "application/json",
                "triggers": {
                    "ticket_created": true,
                    "ticket_updated": true,
                    "ticket_message_created": true
                }
            }
        });

        let requestOptions = {
            method: 'POST',
            headers: getHeaders(email, apiKey),
            body: raw,
            redirect: 'follow'
        };

        return fetch(url, requestOptions)
            .then(response => response.json())
            .then(result => {
                console.log('created the integration')
                console.log(result)
            })
            .catch(error => console.log('error', error));
    }; // End of integrationMethod

    const widgetMethod = (domain, email, apiKey) => {

        const url = `https://${domain}.gorgias.com/api/widgets`;
        const options = {
            method: 'POST',
            headers: getHeaders(email, apiKey),
            body: JSON.stringify({context: 'ticket', order: 0})
        };

        return fetch(url, options)
            .then(res => res.json())
            .then(json => {
                console.log('did something with the widget.')
                console.log(json)
            })
            .catch(err => console.error('error:' + err));
    };

    // Click/submit event
    submitButton.addEventListener('click', () => {

        // Collect form data
        const dataObject = {
            gorgiasEmail: document.querySelector('#gorgiasEmail').value,
            gorgiasDomain: document.querySelector('#gorgiasDomain').value,
            gorgiasAPI: document.querySelector('#gorgiasAPI').value,
            loyaltylionEmail: document.querySelector('#loyaltylionEmail').value,
            loyaltylionAPI: document.querySelector('#loyaltylionAPI').value,
        }

        console.log('', dataObject.gorgiasDomain);

        integrationMethod(dataObject.gorgiasDomain, dataObject.gorgiasEmail, dataObject.gorgiasAPI); // Call integration method with form data
        widgetMethod(dataObject.gorgiasDomain, dataObject.gorgiasEmail, dataObject.gorgiasAPI); // Call widget method with form data
    });
});
