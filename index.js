document.addEventListener("DOMContentLoaded",function(){
    let submitButton = document.querySelector('#connectButton');
  
    const integrationMethod = async(domain) => {
      const url = `https://${domain}.gorgias.com/api/integrations`; // form - gorgiasDomain
    //   const options = {
    //       method: 'POST',
             mode: no-cors,
    //       headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
    //       body: JSON.stringify({
    //         http: {
    //           method: 'GET',
    //           request_content_type: 'application/json',
    //           response_content_type: 'application/json',
    //           triggers: {
    //             'ticket-created': true,
    //             'ticket-updated': false,
    //             'ticket-message-created': true
    //           }
    //         }
    //       })
    //     };

        let options2 = {
            type: "http",
            name: "LoyaltyLion",
            description: "Uros test",
            http: {
                headers: {
                Authorization: "Basic NzUxODViZWQwMDc5N2E3NjgzMTExMDcxM2Q5YWU1OWU6ZTc5ODJiNjRmODE2OWU5NGI1YTU1ZDg2NzNhOWMxODM="
                },
                url: "https://api.loyaltylion.com/v2/customers?email={{ticket.requester.email}}",
                method: "GET",
                request_content_type: "application/json",
                response_content_type: "application/json",
                triggers: {
                'ticket-created': true,
                'ticket-updated': false,
                'ticket-message-created': true
                },
                "form": ""
            }
        }              
  
        fetch(url, options2)
        .then(res => res.json())
        .then(json => {console.log('integration: ', json); return json;})
        .catch(err => {console.error('error:' + err); return err;});
    }; // End of integrationMethod
    
    const widgetMethod = (domain) => {
        
        const url = `https://${domain}.gorgias.com/api/widgets`;
        const options = {
          method: 'POST',
          mode: no-cors,
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
