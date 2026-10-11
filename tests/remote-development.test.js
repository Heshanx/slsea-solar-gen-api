import { describe, it, expect, vi } from 'vitest';
import { remoteDevelopmentGuard } from '../src/middleware/remote-development.middleware.js';

describe('remote development write guard', () => {
  it('blocks every mutation even if a database pooler ignores read-only startup settings', () => {
    const guard=remoteDevelopmentGuard({databaseUrl:'postgresql://example.invalid/db',nodeEnv:'development'});
    for(const method of ['POST','PUT','PATCH','DELETE']) {
      const next=vi.fn();const res={status:vi.fn().mockReturnThis(),json:vi.fn()};
      guard({method},res,next);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error:expect.objectContaining({code:'DATABASE_READ_ONLY'})}));
      expect(next).not.toHaveBeenCalled();
    }
  });
  it('permits reads and preflights', () => {
    const guard=remoteDevelopmentGuard({databaseUrl:'postgresql://example.invalid/db',nodeEnv:'development'});
    for(const method of ['GET','HEAD','OPTIONS']) {const next=vi.fn();guard({method},{},next);expect(next).toHaveBeenCalledOnce();}
  });
  it('leaves isolated local testing and deployed authorization flows available', () => {
    for(const config of [{databaseUrl:'postgresql://127.0.0.1/db',nodeEnv:'development'},
      {databaseUrl:'postgresql://example.invalid/db',nodeEnv:'production'}]) {
      const next=vi.fn();remoteDevelopmentGuard(config)({method:'POST'},{},next);expect(next).toHaveBeenCalledOnce();
    }
  });
});
