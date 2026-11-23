import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/jwt.service';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '../utils/authCookie';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const extractHeaderToken = (req: Request): string | null => {
  const authHeader = req.header('Authorization') || req.header('authorization');
  if (!authHeader) return null;

  const raw = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (authHeader.includes(' ') ? authHeader.split(' ')[1].trim() : authHeader.trim());

  if (!raw || raw === 'null' || raw === 'undefined' || raw === 'cookie-session') {
    return null;
  }
  return raw;
};

export const extractCookieToken = (req: Request): string | null => {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (!cookieToken || typeof cookieToken !== 'string') return null;
  const trimmed = cookieToken.trim();
  return trimmed || null;
};

export const extractAuthToken = (req: Request): string | null => {
  return extractHeaderToken(req) || extractCookieToken(req);
};

export const isValidSameOriginOrHeader = (req: Request): boolean => {
  if (req.get('X-Requested-With')) {
    return true;
  }

  const forwardedHost = req.get('x-forwarded-host')?.split(',')[0].trim();
  const host = forwardedHost || req.get('host');
  if (!host) return false;

  const origin = req.get('origin');
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = req.get('referer');
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return false;
};

export const extractOptionalUser = (req: Request) => {
  const token = extractHeaderToken(req) || extractCookieToken(req);
  if (!token) return null;
  try {
    const decoded: any = jwtService.verifyToken(token);
    if (decoded?.jti && jwtService.isTokenRevokedSync(decoded.jti)) {
      return null;
    }
    return {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
      role: decoded.role || 'student',
      email: decoded.email,
    };
  } catch {
    return null;
  }
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const headerToken = extractHeaderToken(req);
  const cookieToken = headerToken ? null : extractCookieToken(req);
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Enforce CSRF protection on cookie-authenticated mutations
  if (!headerToken && cookieToken && STATE_CHANGING_METHODS.has(req.method.toUpperCase())) {
    if (!isValidSameOriginOrHeader(req)) {
      return res.status(403).json({ message: 'CSRF validation failed for session cookie request' });
    }
  }

  try {
    const decoded: any = jwtService.verifyToken(token);
    if (decoded?.jti && (await jwtService.isTokenRevoked(decoded.jti))) {
      if (cookieToken) {
        clearAuthCookie(req, res);
      }
      return res.status(401).json({ message: 'Session has been logged out' });
    }
    // @ts-ignore
    req.user = {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
      role: decoded.role || 'student',
      email: decoded.email,
      jti: decoded.jti,
    };
    next();
  } catch {
    if (cookieToken) {
      clearAuthCookie(req, res);
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userRole = req.user?.role;
    if (!userRole) return res.status(403).json({ message: 'Authorization denied' });

    // Superadmin has access to anything that admin has
    if (userRole === 'superadmin') {
      return next();
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Authorization denied' });
    }

    next();
  };
};
