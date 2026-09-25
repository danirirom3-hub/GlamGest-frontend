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

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
