import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { issueTestToken } from './helpers/auth-test-support.js';
vi.mock('../src/repositories/analytics.repository.js', () => ({findReadings:vi.fn(), districtSummary:vi.fn()}));
vi.mock('../src/services/geographic.service.js', () => ({getDistrictById:vi.fn()}));
vi.mock('../src/services/solar-site.service.js', () => ({getSiteById:vi.fn()}));
vi.mock('../src/repositories/solar-generation.repository.js', () => ({findLatestBySite:vi.fn()}));
import app from '../src/app.js';
import * as analytics from '../src/repositories/analytics.repository.js';
import * as geography from '../src/services/geographic.service.js';
import * as sites from '../src/services/solar-site.service.js';
import * as readings from '../src/repositories/solar-generation.repository.js';
import { assertIfMatch, representationEtag } from '../src/utils/conditional-response.js';
const id='11111111-1111-4111-8111-111111111111';
beforeEach(()=>{
 vi.clearAllMocks(); analytics.findReadings.mockResolvedValue({data:[],total:7});
 geography.getDistrictById.mockResolvedValue({id,name:'Test District'});
 sites.getSiteById.mockResolvedValue({id,name:'Test installation',capacity_kw:5});
 readings.findLatestBySite.mockResolvedValue(null);
});
describe('Coursework completion contracts',()=>{
 it('returns 415 for unsupported JSON charsets rather than a server error',async()=>{
  const res=await request(app).post('/api/v1/sites').set('Content-Type','application/json; charset=iso-8859-1').send('{}');
  expect(res.status).toBe(415);expect(res.body.success).toBe(false);
 });
 it('exposes conditional-write and creation headers to browser consumers',async()=>{
  const res=await request(app).get('/api/v1/health').set('Origin','https://example.test');
  expect(res.headers['access-control-expose-headers']).toContain('ETag');
  expect(res.headers['access-control-expose-headers']).toContain('Location');
 });
 it('intersects geographic search with actor scope and keeps filters in page links',async()=>{
  const jurisdiction={level:'district',id};const token=await issueTestToken({jurisdiction});
  const res=await request(app).get(`/api/v1/readings?districtId=${id}&page=2&limit=2&sort=asc`).set('Authorization',`Bearer ${token}`);
  expect(res.status).toBe(200);expect(analytics.findReadings).toHaveBeenCalledWith(expect.objectContaining({districtId:id,jurisdiction,sort:'asc',page:2,limit:2}));
  expect(res.body.pagination.next).toContain(`districtId=${id}`);expect(res.body.pagination.previous).toContain('page=1');
 });
 it('returns 304 with an empty body on filtered reading cache hits',async()=>{
  const token=await issueTestToken();const first=await request(app).get('/api/v1/readings').set('Authorization',`Bearer ${token}`);
  const cached=await request(app).get('/api/v1/readings').set('Authorization',`Bearer ${token}`).set('If-None-Match',first.headers.etag);
  expect(cached.status).toBe(304);expect(cached.text).toBe('');
 });
 it('enforces read capability even for an assigned analyst',async()=>{
  const token=await issueTestToken({scopes:[]});const res=await request(app).get('/api/v1/readings').set('Authorization',`Bearer ${token}`);
  expect(res.status).toBe(403);expect(res.body.error.code).toBe('READ_SCOPE_REQUIRED');expect(analytics.findReadings).not.toHaveBeenCalled();
 });
 it('returns 406 on a real resource when JSON is unacceptable',async()=>{
  const res=await request(app).get('/api/v1/readings').set('Accept','application/xml');
  expect(res.status).toBe(406);expect(res.body.error).toEqual({code:'NOT_ACCEPTABLE',message:'Only application/json is available',details:null});
 });
 it('standardizes validation errors',async()=>{
  const token=await issueTestToken();const res=await request(app).get('/api/v1/readings?from=invalid').set('Authorization',`Bearer ${token}`);
  expect(res.status).toBe(400);expect(res.body.error.code).toBe('INVALID_REQUEST');expect(res.body.error.details.validationErrors.length).toBeGreaterThan(0);
 });
 it('returns a composite with null latest reading for an installation without history',async()=>{
  const token=await issueTestToken();const res=await request(app).get(`/api/v1/sites/${id}/overview`).set('Authorization',`Bearer ${token}`);
  expect(res.status).toBe(200);expect(res.body.data.installation.id).toBe(id);expect(res.body.data.latestReading).toBeNull();
 });
 it('reports district summary completeness and stale assets explicitly',async()=>{
  analytics.districtSummary.mockResolvedValue({installation_count:2,reporting_count:1,stale_count:1,last_known_total_power_kw:'4',known_energy_today_kwh:'7',incomplete_energy_count:1});
  const token=await issueTestToken();const res=await request(app).get(`/api/v1/districts/${id}/generation-summary`).set('Authorization',`Bearer ${token}`);
  expect(res.status).toBe(200);expect(res.body.data).toMatchObject({missingReadingCount:1,staleCount:1,energyComplete:false,knownEnergyTodayKwh:7});
  expect(res.headers['cache-control']).toContain('no-store');
 });
 it('rejects stale, weak and missing write preconditions while accepting the current strong ETag',()=>{
  const body={success:true,data:{id,revision:1}};const etag=representationEtag(body);
  expect(()=>assertIfMatch(undefined,body)).toThrow(expect.objectContaining({statusCode:428}));
  expect(()=>assertIfMatch('"stale"',body)).toThrow(expect.objectContaining({statusCode:412}));
  expect(()=>assertIfMatch('W/'+etag,body)).toThrow(expect.objectContaining({statusCode:412}));
  expect(()=>assertIfMatch(etag,body)).not.toThrow();
 });
});
