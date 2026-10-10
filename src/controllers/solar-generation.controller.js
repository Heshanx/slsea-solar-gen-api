
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
    const { page, limit, from, to } = req.validated.query;

    const result = await solarGenerationService.getGeneration(siteId, {
      page,
      limit,
      from,
      to
    });

    const totalPages =
      result.total === 0
        ? 0
        : Math.ceil(result.total / limit);

    res.status(200).json({
      success: true,
      data: result.data.map(mapSolarGeneration),
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
