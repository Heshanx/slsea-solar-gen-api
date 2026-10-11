import * as analytics from "../repositories/analytics.repository.js";
import * as geography from "../services/geographic.service.js";
import * as sites from "../services/solar-site.service.js";
import * as readings from "../repositories/solar-generation.repository.js";
import { mapSolarGeneration } from "../utils/mappers/solar-generation.mapper.js";
import { mapSolarSite } from "../utils/mappers/solar-site.mapper.js";
import { pageMetadata } from "../utils/pagination.js";
import { sendConditionalJson } from "../utils/conditional-response.js";
export const getReadings = async (req, res, next) => {
  try {
    const options = { ...req.validated.query, jurisdiction: req.auth.jurisdiction };
    const result = await analytics.findReadings(options);
    return sendConditionalJson(req, res, { success: true, data: result.data.map(mapSolarGeneration),
      pagination: pageMetadata(req, options, result.total) });
  } catch (error) { next(error); }
};
export const getOverview = async (req, res, next) => {
  try {
    const site = await sites.getSiteById(req.validated.params.id, req.auth.jurisdiction);
    const latest = await readings.findLatestBySite(site.id);
    return sendConditionalJson(req, res, { success: true, data: {
      installation: mapSolarSite(site), latestReading: mapSolarGeneration(latest)
    } });
  } catch (error) { next(error); }
};
export const getDistrictSummary = async (req, res, next) => {
  try {
    const district = await geography.getDistrictById(req.validated.params.id, req.auth.jurisdiction);
    const asOf = new Date().toISOString();
    const row = await analytics.districtSummary(district.id, asOf);
    return res.status(200).set('Cache-Control', 'private, no-store').json({ success: true, data: {
      district: { id: district.id, name: district.name }, asOf, timezone: 'Asia/Colombo',
      installationCount: row.installation_count, reportingCount: row.reporting_count,
      staleCount: row.stale_count, missingReadingCount: row.installation_count - row.reporting_count,
      lastKnownTotalPowerKw: Number(row.last_known_total_power_kw),
      knownEnergyTodayKwh: Number(row.known_energy_today_kwh),
      energyComplete: row.incomplete_energy_count === 0,
      incompleteEnergyInstallationCount: row.incomplete_energy_count
    } });
  } catch (error) { next(error); }
};
