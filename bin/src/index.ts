import dotenvSafe from 'dotenv-safe';

import EmailsValidatorApp from './EmailsValidatorApp';

dotenvSafe.config({
  allowEmptyValues: false,
});

EmailsValidatorApp.init().then((app) => app.start());
