document.addEventListener("DOMContentLoaded",function(){
    let submitButton = document.querySelector('#connectButton');
  
    // Authorization: 'Basic ' + btoa(email + ":" + apiKey)
    const integrationMethod = async(domain, email, apiKey) => {
      const url = `https://${domain}.gorgias.com/api/integrations?&`; // form - gorgiasDomain

      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", btoa(email + ":" + apiKey));

      let raw = JSON.stringify({
        "name": "My HTTP integration",
        "type": "http",
        "mode": "no-cors", 
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
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };

      fetch(url, requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));
    }; // End of integrationMethog
    
    const widgetMethod = (domain) => {
        
        const url = `https://${domain}.gorgias.com/api/widgets`;
        const options = {
          method: 'POST',
          headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
          body: JSON.stringify({context: 'ticket', order: 0})
        };
        
        fetch(url, options)
          .then(res => res.json())
          .then(json => console.log(json))
          .catch(err => console.error('error:' + err));
    };

    // Click/submit event
    submitButton.addEventListener('click', () => {

      // Collect form data
      let dataObject = {
        gorgiasEmail: document.querySelector('#gorgiasEmail').value,
        gorgiasDomain: document.querySelector('#gorgiasDomain').value,
        gorgiasAPI: document.querySelector('#gorgiasAPI').value,
        loyaltylionEmail: document.querySelector('#loyaltylionEmail').value,
        loyaltylionAPI:  document.querySelector('#loyaltylionAPI').value,
      }

      console.log('', dataObject.gorgiasDomain);

      integrationMethod(dataObject.gorgiasDomain); // Call integration method with form data
      widgetMethod(dataObject.gorgiasDomain); // Call widget method with form data
    });
  });
