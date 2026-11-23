import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { RevokedToken } from '../models/RevokedToken';

export interface JwtUserPayload {
  userId: string;
  role: string;
  email?: string;
  jti?: string;
  exp?: number;
  iat?: number;
}

// Runtime fallback secret in case JWT_SECRET is not configured in environment
const RUNTIME_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

// Fast in-memory revocation cache (jti -> expiration timestamp in ms)
const revokedJtiCache = new Map<string, number>();

const pruneExpiredCache = () => {
  const now = Date.now();
  for (const [jti, expMs] of revokedJtiCache.entries()) {
    if (expMs <= now) {
      revokedJtiCache.delete(jti);
    }
  }
};

class JwtService {
  private getSecret(): string {
    return process.env.JWT_SECRET || RUNTIME_FALLBACK_SECRET;
  }

  /**
   * Generates a signed JWT with configurable expiration ('1d' default session, '30d' remember me, '7d' legacy)
   */
  generateToken(payload: JwtUserPayload, expiresIn: SignOptions['expiresIn'] = '7d'): string {
    const jti = payload.jti || crypto.randomUUID();
    return jwt.sign(
      {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        jti,
      },
      this.getSecret(),
      { expiresIn }
    );
  }

  /**
   * Synchronously checks fast revocation cache
   */
  isTokenRevokedSync(jti?: string): boolean {
    if (!jti) return false;
    const expMs = revokedJtiCache.get(jti);
    if (!expMs) return false;
    if (expMs <= Date.now()) {
      revokedJtiCache.delete(jti);
      return false;
    }
    return true;
  }

  /**
   * Checks both fast in-memory cache and persistent MongoDB RevokedToken collection
   */
  async isTokenRevoked(jti?: string): Promise<boolean> {
    if (!jti) return false;
    if (this.isTokenRevokedSync(jti)) return true;

    if (mongoose.connection.readyState === 1) {
      try {
        const record: any = await RevokedToken.findOne({ jti }).select('expiresAt').lean();
        if (record) {
          const expMs = record.expiresAt ? new Date(record.expiresAt).getTime() : Date.now() + 86400000;
          revokedJtiCache.set(jti, expMs);
          return true;
        }
      } catch {
        // Ignore transient lookup failures; fallback relies on in-memory cache
      }
    }
    return false;
  }

  /**
   * Revokes a JWT by jti in both memory and MongoDB until its natural expiration
   */
  async revokeToken(jti?: string, expSeconds?: number): Promise<void> {
    if (!jti) return;
    pruneExpiredCache();
    const expMs = expSeconds ? expSeconds * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000;
    revokedJtiCache.set(jti, expMs);

    if (mongoose.connection.readyState === 1) {
      try {
        await RevokedToken.findOneAndUpdate(
          { jti },
          { jti, expiresAt: new Date(expMs) },
          { upsert: true, new: true }
        );
      } catch {
        // Safe fallback: token remains revoked in memory for this runtime instance
      }
    }
  }

  /**
   * Verifies an incoming JWT string and rejects cached revoked tokens
   */
  verifyToken(token: string): JwtUserPayload {
    const decoded = jwt.verify(token, this.getSecret()) as JwtUserPayload;
    if (decoded?.jti && this.isTokenRevokedSync(decoded.jti)) {
      throw new Error('Token has been revoked');
    }
    return decoded;
  }
}

export const jwtService = new JwtService();
export default jwtService;
