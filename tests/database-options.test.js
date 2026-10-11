import { describe, it, expect } from 'vitest';
import { databaseOptions } from '../src/config/database-options.js';

describe('database connection safety', () => {
  it('verifies remote TLS and requests read-only nonproduction sessions', () => {
    for (const mode of ['development', 'test', 'integration']) {
      const options = databaseOptions('postgresql://example.invalid/db', mode);
      expect(options.ssl.rejectUnauthorized).toBe(true);
      expect(options.connection.default_transaction_read_only).toBe('on');
    }
  });
  it('retains TLS verification with an explicitly trusted CA in production', () => {
    const options = databaseOptions('postgresql://example.invalid/db', 'production', 'test CA');
    expect(options.ssl).toEqual({ rejectUnauthorized: true, ca: 'test CA' });
    expect(options.connection).toBeUndefined();
  });
  it('allows isolated loopback development writes without disabling remote verification', () => {
    for (const host of ['localhost', '127.0.0.1', '[::1]']) {
      const options = databaseOptions(`postgresql://${host}/db`, 'development');
      expect(options.connection).toBeUndefined();
      expect(options.ssl).toBeUndefined();
    }
  });
});
