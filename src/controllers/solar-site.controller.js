import { sendConditionalJson } from "../utils/conditional-response.js";
import { pageMetadata } from "../utils/pagination.js";
import * as solarSiteService from "../services/solar-site.service.js";
import { mapSolarSite } from "../utils/mappers/solar-site.mapper.js";

export const getSites = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      active
    } = req.validated.query;

    const result = await solarSiteService.getAllSites({
      page,
      limit,
      active,
      jurisdiction: req.auth.jurisdiction
    });

    return sendConditionalJson(req, res, {
      success: true, data: result.data.map(mapSolarSite),
      pagination: pageMetadata(req, { page, limit }, result.total)
    });
  } catch (error) {
    next(error);
  }
};

export const getSite = async (req, res, next) => {
  try {
    const site = await solarSiteService.getSiteById(
      req.validated.params.id,
      req.auth.jurisdiction
    );

    return sendConditionalJson(req, res, {
      success: true, data: mapSolarSite(site)
    }, site.updated_at);
  } catch (error) {
    next(error);
  }
};

export const createSite = async (req, res, next) => {
  try {
    const site = await solarSiteService.createSite(
      req.validated.body
    );

    res.location(`${req.baseUrl}/${site.id}`);
    res.status(201).json({
      success: true,
      data: mapSolarSite(site)
    });
  } catch (error) {
    next(error);
  }
};

export const updateSite = async (req, res, next) => {
  try {
    const site = await solarSiteService.updateSite(
      req.validated.params.id,
      req.validated.body,
      req.get("if-match")
    );

    res.status(200).json({
      success: true,
      data: mapSolarSite(site)
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSite = async (req, res, next) => {
  try {
    await solarSiteService.deleteSite(req.validated.params.id, req.get("if-match"));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
