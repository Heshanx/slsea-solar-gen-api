// Keep schema examples and response contracts aligned with the public mappers.
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const response = (schema) => ({ 'application/json': { schema } });
const item = (name) => ({ type: 'object', required: ['success', 'data'], properties: {
  success: { type: 'boolean', enum: [true] }, data: ref(name)
} });
const collection = (name, pagination = 'CollectionPagination') => ({
  type: 'object', required: ['success', 'data', 'pagination'], properties: {
    success: { type: 'boolean', enum: [true] },
    data: { type: 'array', items: ref(name) }, pagination: ref(pagination)
  }
});

export function completeContracts(spec) {
  const s = spec.components.schemas;
  const registryFields = {
    substationId: { type: 'string', format: 'uuid', description: 'Existing grid substation ID' },
    meterInverterId: { type: 'string', minLength: 1, maxLength: 150, example: 'DEMO-METER-NEW' },
    installationCode: { type: 'string', nullable: true, maxLength: 100 },
    installationType: { type: 'string', nullable: true, maxLength: 100 },
    operatorName: { type: 'string', nullable: true, maxLength: 150 },
    commissionedAt: { type: 'string', format: 'date', nullable: true }
  };
  for (const name of ['CreateSolarSite', 'UpdateSolarSite']) {
    Object.assign(s[name].properties, registryFields);
    for (const key of ['latitude', 'longitude', 'location']) s[name].properties[key].nullable = true;
    s[name].properties.capacityKw = { type: 'number', minimum: 0.001, maximum: 999999999.999, example: 10 };
    s[name].properties.timezone.default = 'Asia/Colombo';
    s[name].example = { name: 'Demonstration rooftop', capacityKw: 10, timezone: 'Asia/Colombo',
      substationId: '11111111-1111-4111-8111-111111111111', meterInverterId: 'DEMO-METER-NEW',
      ...(name === 'UpdateSolarSite' ? { isActive: true } : {}) };
  }
  s.CreateSolarSite.required = s.CreateSolarSite.required.filter(x => x !== 'timezone');
  delete s.UpdateSolarSite.properties.timezone.default;
  s.SolarSite.properties.meterInverterId = { type: 'string', nullable: true };
  for (const key of ['latitude', 'longitude', 'location']) s.SolarSite.properties[key].nullable = true;
  s.CreateSolarGeneration.properties.voltageV = { type: 'number', minimum: 0.01, maximum: 999999.99, example: 230 };
  s.SolarGeneration.properties.voltageV = { ...s.CreateSolarGeneration.properties.voltageV, nullable: true };
  for (const key of ['powerKw', 'energyKwh']) {
    s.CreateSolarGeneration.properties[key].maximum = 999999999.999;
    s.CreateSolarGeneration.properties[key].minimum = 0;
  }
  // In OAS 3.0 nullable must apply to a schema with an explicit type, not a $ref sibling.
  s.InstallationOverview.properties.data.properties.latestReading = {
    ...structuredClone(s.SolarGeneration), nullable: true
  };
  s.SiteResponse = item('SolarSite');
  s.SiteCollection = collection('SolarSite', 'Pagination');
  s.GenerationCollection = collection('SolarGeneration');
  s.WeatherResponse = item('Weather');
  s.WeatherCollection = collection('Weather', 'WeatherPagination');
  s.WeatherPagination = structuredClone(s.CollectionPagination);
  s.ForecastResponse = { type: 'object', required: ['success', 'data'], properties: {
    success: { type: 'boolean' }, data: { type: 'object', required: ['siteId', 'provider', 'forecast'], properties: {
      siteId: { type: 'string', format: 'uuid' }, provider: { type: 'string' }, timezone: { type: 'string' },
      latitude: { type: 'number' }, longitude: { type: 'number' },
      forecast: { type: 'array', items: { type: 'object', properties: {
        recordedAt: { type: 'string', format: 'date-time' },
        ...Object.fromEntries(['temperatureC', 'humidityPercent', 'cloudCoverPercent', 'windSpeedMs', 'irradianceWM2']
          .map(key => [key, { type: 'number', nullable: true }]))
      } } }
    } }
  } };
  s.HealthResponse = { type: 'object', required: ['success', 'data'], properties: {
    success: { type: 'boolean' }, data: { type: 'object', required: ['status', 'service'], properties: {
      status: { type: 'string' }, service: { type: 'string' }, version: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' }
    } }
  } };

  const bodies = {
    '/api/v1/sites': { get: 'SiteCollection', post: 'SiteResponse' },
    '/api/v1/sites/{id}': { get: 'SiteResponse', put: 'SiteResponse' },
    '/api/v1/sites/{siteId}/generation': { get: 'GenerationCollection', post: 'GenerationResponse' },
    '/api/v1/sites/{siteId}/generation/{id}': { get: 'GenerationResponse' },
    '/api/v1/sites/{siteId}/weather': { get: 'WeatherCollection', post: 'WeatherResponse' },
    '/api/v1/sites/{siteId}/weather/{id}': { get: 'WeatherResponse' },
    '/api/v1/sites/{siteId}/weather/forecast': { get: 'ForecastResponse' },
    '/api/v1/health': { get: 'HealthResponse' },
    '/api/v1/health/database': { get: 'HealthResponse' }
  };
  for (const [path, methods] of Object.entries(bodies)) {
    for (const [method, schema] of Object.entries(methods)) {
      spec.paths[path][method].responses[method === 'post' ? 201 : 200].content = response(ref(schema));
    }
  }
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op.responses) continue;
      const publicHealth = path.includes('/health');
      if (publicHealth) {
        for (const code of ['401', '403', '404', '429']) delete op.responses[code];
      } else {
        op.responses[503] = { description: 'Identity, authorization or database service unavailable', content: response(ref('Error')) };
      }
      if (['post', 'put'].includes(method)) {
        op.responses[413] = { description: 'Request body exceeds 100 kB', content: response(ref('Error')) };
        op.responses[415] = { description: 'Unsupported media type or encoding', content: response(ref('Error')) };
      }
      if (path.includes('/sites')) {
        op.responses[405] = { description: 'Unsupported resource method', headers: { Allow: { schema: { type: 'string' } } }, content: response(ref('Error')) };
      }
      if (path.endsWith('/generation-summary')) {
        op.description = `${op.description || ''} Summaries are not cached.`.trim();
      }
    }
  }
  spec.paths['/api/v1/sites/{id}'].put.description = 'Replace all editable values. Omitted optional fields are cleared. Requires the current strong ETag in If-Match.';
  // Route version and documentation must change together.
  const version = process.env.API_VERSION || 'v1';
  if (version !== 'v1') spec.paths = Object.fromEntries(Object.entries(spec.paths)
    .map(([path, operation]) => [path.replace('/api/v1/', `/api/${version}/`), operation]));
  return spec;
}
