import { getLocale } from '../i18n/messages.js';

export function localeMiddleware(req, res, next) {
  req.locale = getLocale(req);
  next();
}
