import { readFileSync } from 'node:fs';

// Inline PEM is convenient for hosting; a file path avoids multiline local .env values.
export function loadDatabaseCa(environment = process.env) {
  if (environment.DATABASE_SSL_CA?.trim()) return environment.DATABASE_SSL_CA;
  if (environment.DATABASE_SSL_CA_FILE?.trim()) {
    return readFileSync(environment.DATABASE_SSL_CA_FILE, 'utf8');
  }
  return undefined;
}
