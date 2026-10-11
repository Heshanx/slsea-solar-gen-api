import { completeContracts } from "./swagger-contracts.js";

const string = { type: 'string' };
const json = schema => ({ 'application/json': { schema } });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
export const completeSwagger = spec => {
  const schemas = spec.components.schemas;
  schemas.Error = { type: 'object', required: ['success','error'], properties: {
    success: { type:'boolean', enum:[false] }, error: { type:'object', required:['code','message','details'],
      properties:{ code:string, message:string, details:{ type:'object', nullable:true, additionalProperties:true } } }
  }};
  schemas.SolarSite.properties.revision = { type:'integer', minimum:1 };
  for (const name of ['CreateSolarSite','UpdateSolarSite']) {
    schemas[name].required = [...new Set([...schemas[name].required,'substationId','meterInverterId'])];
  }
  schemas.CreateSolarGeneration.required = ['recordedAt','powerKw','energyKwh','voltageV'];
  delete schemas.CreateSolarGeneration.anyOf;
  for (const name of ['CreateSolarGeneration']) {
    schemas[name].properties.powerKw.nullable = false;
    schemas[name].properties.energyKwh.nullable = false;
    schemas[name].properties.energyKwh.description = 'Cumulative meter energy counter in kWh; never sum counters across timestamps.';
  }
  schemas.SolarGeneration.properties.energySemantics = {type:'string',enum:['cumulative','legacy_unspecified'],description:'Legacy historical rows are not relabelled as cumulative.'};
  schemas.Pagination = { type:'object', properties: {
    page:{type:'integer'}, limit:{type:'integer'}, total:{type:'integer'}, totalPages:{type:'integer'},
    first:{...string,nullable:true}, previous:{...string,nullable:true}, next:{...string,nullable:true}, last:{...string,nullable:true}
  }};
  schemas.ReadingCollection = { type:'object', properties: { success:{type:'boolean'},
    data:{type:'array',items:ref('SolarGeneration')},pagination:ref('Pagination') }};
  schemas.InstallationOverview = { type:'object', properties:{success:{type:'boolean'},data:{type:'object',
    properties:{installation:ref('SolarSite'),latestReading:{...ref('SolarGeneration'),nullable:true}}}}};
  schemas.DistrictSummary = { type:'object',properties:{success:{type:'boolean'},data:{type:'object',properties:{
    district:{type:'object',properties:{id:{type:'string',format:'uuid'},name:string}},
    asOf:{type:'string',format:'date-time'},timezone:string,installationCount:{type:'integer'},reportingCount:{type:'integer'},
    missingReadingCount:{type:'integer'},staleCount:{type:'integer'},lastKnownTotalPowerKw:{type:'number'},
    knownEnergyTodayKwh:{type:'number'},energyComplete:{type:'boolean'},incompleteEnergyInstallationCount:{type:'integer'}
  }}}};
  spec.paths['/api/v1/readings'] = {get:{ tags:['Solar Generation'],summary:'Search permitted readings by geography and time',
    parameters:[...['provinceId','districtId','substationId','installationId'].map(name=>({in:'query',name,schema:{type:'string',format:'uuid'}})),
      ...['from','to'].map(name=>({in:'query',name,schema:{type:'string',format:'date-time'}})),
      {in:'query',name:'sort',schema:{type:'string',enum:['asc','desc'],default:'desc'}},
      {in:'query',name:'page',schema:{type:'integer',minimum:1,default:1}},
      {in:'query',name:'limit',schema:{type:'integer',minimum:1,maximum:100,default:50}}],
    responses:{200:{description:'Filtered scoped collection',content:json(ref('ReadingCollection'))}}}};
  const id = [{in:'path',name:'id',required:true,schema:{type:'string',format:'uuid'}}];
  spec.paths['/api/v1/sites/{id}/overview'] = {get:{tags:['Solar Sites'],summary:'Installation and its last-known reading',
    parameters:id,responses:{200:{description:'Composite resource; latestReading is null when absent',content:json(ref('InstallationOverview'))}}}};
  spec.paths['/api/v1/districts/{id}/generation-summary'] = {get:{tags:['Geography'],
    summary:'Active installation totals, with stale and incomplete data indicators',description:'Sri Lankan calendar day. Last-known power includes stale readings. Daily energy uses cumulative counter differences only where the midnight baseline exists and no counter decrease occurs. Incomplete installations are excluded from knownEnergyTodayKwh and reported explicitly.',
    parameters:id,responses:{200:{description:'Derived district summary',content:json(ref('DistrictSummary'))}}}};
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(item)) {
      if (!['get','post','put','delete','patch'].includes(method)) continue;
      op.responses ??= {};
      for (const [code, description] of Object.entries({400:'Invalid request',401:'Missing or invalid identity',403:'Permission denied',404:'Not found or outside jurisdiction',406:'Only JSON is available',429:'Rate limit exceeded'})) {
        op.responses[code] = {description,content:json(ref('Error'))};
      }
      if (method==='get' && !path.includes('generation-summary') && !path.includes('/health')) {
        op.parameters ??= [];
        op.parameters.push({in:'header',name:'If-None-Match',schema:string});
        op.responses[304]={description:'Current representation; empty response body'};
        if(op.responses[200]) op.responses[200].headers={...(op.responses[200].headers||{}),ETag:{schema:string}};
      }
      if (method==='post') {
        if(op.responses[201]) op.responses[201].headers={Location:{schema:string,description:'Relative URL of the created resource'}};
        op.responses[409]={description:'Duplicate identifier or reading timestamp',content:json(ref('Error'))};
        op.responses[415]={description:'Send application/json',content:json(ref('Error'))};
      }
      if(['put','delete'].includes(method)) {
        op.parameters ??= [];
        op.parameters.push({in:'header',name:'If-Match',required:true,schema:string,description:'Strong ETag from GET /sites/{id}'});
        op.responses[412]={description:'Stale resource version',content:json(ref('Error'))};
        op.responses[428]={description:'If-Match is required',content:json(ref('Error'))};
        if(method==='delete')op.description='Logical deletion: disappears from normal reads; original readings remain immutable.';
      }
    }
  }
  spec.paths['/api/v1/sites/{id}'].get.responses[200].headers['Last-Modified']={schema:string};
  return completeContracts(spec);
};
