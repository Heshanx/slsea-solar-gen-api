
import * as weatherService from "../services/weather.service.js";
import { mapWeather } from "../utils/mappers/weather.mapper.js";

export const createWeather = async (req, res, next) => {
  try {
    const { siteId } = req.validated.params;

    const weather = await weatherService.createWeather({
      ...req.validated.body,
      siteId
    });

    res.status(201).json({
      success: true,
      data: mapWeather(weather)
    });
  } catch (error) {
    next(error);
  }
};

export const getWeather = async (req, res, next) => {
  try {
    const { siteId } = req.validated.params;
    const { page, limit, from, to } = req.validated.query;

    const result = await weatherService.getWeather(siteId, {
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
      data: result.data.map(mapWeather),
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

export const getWeatherById = async (req, res, next) => {
  try {
    const { siteId, id } = req.validated.params;

    const weather = await weatherService.getWeatherById(siteId, id);

    res.status(200).json({
      success: true,
      data: mapWeather(weather)
    });
  } catch (error) {
    next(error);
  }
};
