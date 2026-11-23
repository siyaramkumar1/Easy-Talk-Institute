import { Request, Response } from 'express';

export const AUTH_COOKIE_NAME = 'et_auth_token';
export const REMEMBER_ME_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Determines whether the incoming request arrived over HTTPS (direct TLS or behind reverse proxy).
 */
export const isHttpsRequest = (req: Request): boolean => {
  const forwardedProto = req.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
  }
  return req.secure || req.protocol === 'https';
};

/**
 * Sets an HttpOnly JWT session cookie.
 * - rememberMe = true: persistent cookie (30-day Max-Age & Expires), survives browser close/reopen.
 * - rememberMe = false: session cookie (no Max-Age/Expires), survives page refresh, clears on browser close.
 */
export const setAuthCookie = (
  req: Request,
  res: Response,
  token: string,
  rememberMe: boolean
): void => {
  const isHttps = isHttpsRequest(req);
  const attributes = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
  ];

  if (rememberMe) {
    const expiresAt = new Date(Date.now() + REMEMBER_ME_DURATION_SECONDS * 1000).toUTCString();
    attributes.push(`Max-Age=${REMEMBER_ME_DURATION_SECONDS}`);
    attributes.push(`Expires=${expiresAt}`);
  }

  if (isHttps) {
    attributes.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    attributes.push('SameSite=Lax');
  }

  res.append('Set-Cookie', attributes.join('; '));
};

/**
 * Clears the HttpOnly authentication cookie with matching scope and security attributes.
 */
export const clearAuthCookie = (req: Request, res: Response): void => {
  const isHttps = isHttpsRequest(req);
  const attributes = [
    `${AUTH_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
  ];

  if (isHttps) {
    attributes.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    attributes.push('SameSite=Lax');
  }

  res.append('Set-Cookie', attributes.join('; '));
};
