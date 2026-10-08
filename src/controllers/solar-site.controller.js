import * as solarSiteService from "../services/solar-site.service.js";

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
      active
    });

    const totalPages =
      result.total === 0
        ? 0
        : Math.ceil(result.total / limit);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSite = async (req, res, next) => {
  try {
    const site = await solarSiteService.getSiteById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    next(error);
  }
};

export const createSite = async (req, res, next) => {
  try {
    const site = await solarSiteService.createSite(req.body);

    res.status(201).json({
      success: true,
      data: site
    });
  } catch (error) {
    next(error);
  }
};

export const updateSite = async (req, res, next) => {
  try {
    const site = await solarSiteService.updateSite(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSite = async (req, res, next) => {
  try {
    await solarSiteService.deleteSite(req.params.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};