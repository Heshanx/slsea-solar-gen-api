
import * as weatherService from "../services/weather.service.js";
import { mapWeather } from "../utils/mappers/weather.mapper.js";
import { pageMetadata } from "../utils/pagination.js";
import { sendConditionalJson } from "../utils/conditional-response.js";

export const createWeather = async (req, res, next) => {
  try {
    const { siteId } = req.validated.params;

    const weather = await weatherService.createWeather({
      ...req.validated.body,
      siteId
    });

    res.location(`${req.baseUrl}/${siteId}/weather/${weather.id}`);
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
    }, req.auth.jurisdiction);

    sendConditionalJson(req, res, {
      success: true,
      data: result.data.map(mapWeather),
      pagination: pageMetadata(req, { page, limit }, result.total)
    });
  } catch (error) {
    next(error);
  }
};

export const getWeatherById = async (req, res, next) => {
  try {
    const { siteId, id } = req.validated.params;

    const weather = await weatherService.getWeatherById(
      siteId, id, req.auth.jurisdiction
    );

    sendConditionalJson(req, res, {
      success: true,
      data: mapWeather(weather)
    });
  } catch (error) {
    next(error);
  }
};
