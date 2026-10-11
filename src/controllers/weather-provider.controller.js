import { getSiteWeatherForecast } from "../services/weather-provider.service.js";

export const getWeatherForecast = async (req, res, next) => {
  try {
    const { siteId } = req.validated.params;

    const result = await getSiteWeatherForecast(
      siteId,
      req.auth.jurisdiction
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
