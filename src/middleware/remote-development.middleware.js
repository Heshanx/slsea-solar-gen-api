import { errorBody } from '../utils/error-response.js';

export function remoteDevelopmentGuard({ databaseUrl, nodeEnv }) {
  const remote = databaseUrl && !['localhost','127.0.0.1','[::1]'].includes(new URL(databaseUrl).hostname);
  const readOnly = remote && nodeEnv !== 'production';
  return (req, res, next) => {
    // Poolers can ignore startup session settings. Enforce this at the API boundary too.
    if (readOnly && !['GET','HEAD','OPTIONS'].includes(req.method)) {
      return res.status(503).json(errorBody('DATABASE_READ_ONLY',
        'Remote database writes are disabled in development; use an isolated local database'));
    }
    next();
  };
}
