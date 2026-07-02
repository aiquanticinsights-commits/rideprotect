import crypto from 'crypto';

export interface JWTPayload {
  sub?: string;
  email?: string;
  type?: 'access' | 'refresh';
  sessionId?: string;
  [key: string]: unknown;
}

export function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

export function base64urlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export class SignJWT {
  private payload: Record<string, unknown> = {};
  private header: Record<string, string> = {};

  constructor(payload: Record<string, unknown>) {
    this.payload = { ...payload };
  }

  setProtectedHeader(header: Record<string, string>): this {
    this.header = { ...header };
    return this;
  }

  setIssuedAt(): this {
    this.payload.iat = Math.floor(Date.now() / 1000);
    return this;
  }

  setExpirationTime(time: string): this {
    const match = time.match(/^(\d+)([smhd])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      const seconds = { s: value, m: value * 60, h: value * 3600, d: value * 86400 }[unit] || 0;
      this.payload.exp = Math.floor(Date.now() / 1000) + seconds;
    }
    return this;
  }

  async sign(_secret: Uint8Array): Promise<string> {
    const header = base64url(JSON.stringify(this.header));
    const payload = base64url(JSON.stringify(this.payload));
    const signature = base64url(crypto.createHmac('sha256', _secret).update(`${header}.${payload}`).digest());
    return `${header}.${payload}.${signature}`;
  }
}

export async function jwtVerify(
  token: string,
  secret: Uint8Array,
): Promise<{ payload: JWTPayload }> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const [header, payload, signature] = parts;
  const expectedSig = base64url(crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest());

  if (signature !== expectedSig) throw new Error('Invalid signature');

  return { payload: JSON.parse(base64urlDecode(payload)) as JWTPayload };
}

export function decodeProtectedHeader(token: string): Record<string, string> {
  const [header] = token.split('.');
  return JSON.parse(base64urlDecode(header));
}
