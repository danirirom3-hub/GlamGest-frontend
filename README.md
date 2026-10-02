# GlamGest

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Google reCAPTCHA v2

Login and registration use the Google reCAPTCHA v2 Checkbox (`I'm not a robot`). Configure the public site key in both Angular environment files by replacing the value of `RECAPTCHA_SITE_KEY`:

```ts
RECAPTCHA_SITE_KEY: '<clave-publica-de-Google>'
```

Register the frontend domains in Google reCAPTCHA, including `localhost`. This supports both `http://localhost:4200` and `http://localhost:3000`; the port is selected when starting Angular:

```bash
npm install
npm start -- --port 4200
npm start -- --port 3000
```

The captcha token is kept only in memory, sent to the backend as `recaptchaToken`, and reset after every login or registration attempt. The frontend never sends the Google secret key or `remoteip` and does not call Google's verification endpoint.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Production API and CORS

The production API URL is not configured yet because this repository does not contain a
verified public backend URL. Before publishing, replace the placeholder in
`src/environments/environment.prod.ts` with the real backend origin, including exactly one
`/api` suffix:

```ts
apiUrl: 'https://DOMINIO_REAL_DEL_BACKEND/api'
```

Do not use `api.example.com` in a published build and do not add a second `/api`. The local
development environment uses `http://localhost:8081/api` while the new backend test container
is exposed on port `8081`.

For a Docker build, inject the production API URL explicitly:

```bash
docker build --build-arg API_URL=http://localhost:8081/api -t glamgest-frontend:local .
```

The backend must allow the deployed frontend origin, for example:

```text
CORS_ALLOWED_ORIGINS=https://DOMINIO_REAL_DEL_FRONTEND
```

The actual frontend domain must replace the placeholder before deployment. API services use
`environment.apiUrl`; no service should contain a hardcoded production API URL.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
