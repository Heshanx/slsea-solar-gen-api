import { z } from "zod";

export const getWeatherForecastSchema = z.object({
  body: z.object({}),
  params: z.object({
    siteId: z.string().uuid("Invalid solar site ID")
  }),
  query: z.object({})
});