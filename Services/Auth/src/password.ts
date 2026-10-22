import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
export function hash(password: string): string {
  const salt = randomBytes(16);
  return ['PBKDF2', '100000', salt.toString('base64'), pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('base64')].join('$');
}
export function verify(password: string, stored: string): boolean {
  try {
    const [format, rounds, salt, expected] = stored.split('$');
    const iterations = Number(rounds);
    if (format !== 'PBKDF2' || !Number.isInteger(iterations) || iterations < 1 || iterations > 1000000) return false;
    const bytes = Buffer.from(expected, 'base64');
    if (bytes.length !== 32) return false;
    return timingSafeEqual(bytes, pbkdf2Sync(password, Buffer.from(salt, 'base64'), iterations, bytes.length, 'sha256'));
  } catch { return false; }
}
