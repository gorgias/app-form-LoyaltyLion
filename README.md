# LoyaltyLion form

This forms allows you to create a LoyaltyLion integration into your Gorgias account easily. Feel free to fork it and adapt it, in order to create a form to easily add your own application to Gorgias!

The form is accessible there: https://gorgias.github.io/app-form-LoyaltyLion/

## Backend

The form posts the merchant's Gorgias credentials and LoyaltyLion API key to the `app-form-loyaltylion` Cloud Function (source in `functions/app-form-redirect/`). The function builds the LoyaltyLion HTTP integration and its ticket widget, then creates them through the Gorgias REST API of the given account. It accepts requests from `https://gorgias.github.io` only and never stores or logs credentials.

Run the tests:

```
cd functions/app-form-redirect && npm install && npm test
```

Deploy (gen2, project `gorgias-apps-cloud-functions`). It runs as a dedicated service account with no IAM roles:

```
gcloud functions deploy app-form-loyaltylion --gen2 --project gorgias-apps-cloud-functions --region us-central1 \
  --runtime nodejs22 --entry-point redirect --trigger-http --allow-unauthenticated --ingress-settings all \
  --service-account app-form-loyaltylion@gorgias-apps-cloud-functions.iam.gserviceaccount.com \
  --max-instances 3 --memory 256Mi --timeout 30s --source functions/app-form-redirect
```

Deploy the function before merging form changes to `main`: GitHub Pages publishes `main` right away.
