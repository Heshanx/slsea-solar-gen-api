
import * as solarGenerationService from "../services/solar-generation.service.js";
import { mapSolarGeneration } from "../utils/mappers/solar-generation.mapper.js";

export const createGeneration = async (req, res, next) => {
  try {
    const { siteId } = req.validated.params;

    const generation = await solarGenerationService.createGeneration({
      ...req.validated.body,
      siteId
    });

    res.status(201).json({
      success: true,
      data: mapSolarGeneration(generation)
    });
  } catch (error) {
    next(error);
  }
};

export const getGeneration = async (req, res, next) => {
  try {
    const { siteId } = req.validated.params;
    const { page, limit, from, to, sort } = req.validated.query;

    const result = await solarGenerationService.getGeneration(siteId, {
      page,
      limit,
      from,
      to,
      sort
    });

    const totalPages =
      result.total === 0
        ? 0
        : Math.ceil(result.total / limit);

    const pageLink = (targetPage) => {
      if (targetPage < 1 || targetPage > totalPages) {
        return null;
      }

      const url = new URL(req.originalUrl, "http://localhost");
      url.search = "";
      url.searchParams.set("page", String(targetPage));
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("sort", sort);

      if (from) url.searchParams.set("from", from);
      if (to) url.searchParams.set("to", to);

      return `${url.pathname}${url.search}`;
    };

    res.status(200).json({
      success: true,
      data: result.data.map(mapSolarGeneration),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        next: pageLink(page + 1),
        previous: pageLink(page - 1)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getGenerationById = async (req, res, next) => {
  try {
    const { siteId, id } = req.validated.params;

    const generation =
      await solarGenerationService.getGenerationById(siteId, id);

    res.status(200).json({
      success: true,
      data: mapSolarGeneration(generation)
    });
  } catch (error) {
    next(error);
  }
};
