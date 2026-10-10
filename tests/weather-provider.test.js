import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach
} from "vitest";

import { AppError } from "../src/utils/AppError.js";

vi.mock("../src/repositories/solar-site.repository.js", () => ({
  findById: vi.fn()
}));

import * as solarSiteRepository from "../src/repositories/solar-site.repository.js";
import { getSiteWeatherForecast } from "../src/services/weather-provider.service.js";

const siteId = "588f49ed-0b04-43b0-9617-d078af39e321";

const mockSite = {
  id: siteId,
  latitude: 6.9271,
  longitude: 79.8612
};

describe("Weather provider service", () => {
  let fetchMock;

  beforeEach(() => {
    vi.clearAllMocks();

    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    solarSiteRepository.findById.mockResolvedValue({
      ...mockSite
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return 404 when the solar site does not exist", async () => {
    solarSiteRepository.findById.mockResolvedValue(null);

    await expect(
      getSiteWeatherForecast(siteId)
    ).rejects.toMatchObject({
      message: "Solar site not found",
      statusCode: 404
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should return 400 when site coordinates are missing", async () => {
    solarSiteRepository.findById.mockResolvedValue({
      ...mockSite,
      latitude: null
    });

    await expect(
      getSiteWeatherForecast(siteId)
    ).rejects.toMatchObject({
      message: "Solar site must have latitude and longitude configured",
      statusCode: 400
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should return 400 when site coordinates are invalid", async () => {
    solarSiteRepository.findById.mockResolvedValue({
      ...mockSite,
      latitude: 91
    });

    await expect(
      getSiteWeatherForecast(siteId)
    ).rejects.toMatchObject({
      message: "Solar site has invalid coordinates",
      statusCode: 400
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should return 502 when the provider request fails", async () => {
    fetchMock.mockRejectedValue(new Error("Network failure"));

    await expect(
      getSiteWeatherForecast(siteId)
    ).rejects.toMatchObject({
      message: "Weather provider is unavailable or timed out",
      statusCode: 502
    });
  });

  it("should return 502 when the provider responds unsuccessfully", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503
    });

    await expect(
      getSiteWeatherForecast(siteId)
    ).rejects.toMatchObject({
      message: "Weather provider returned an unsuccessful response",
      statusCode: 502
    });
  });

  it("should return 502 when the provider returns invalid JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON"))
    });

    await expect(
      getSiteWeatherForecast(siteId)
    ).rejects.toMatchObject({
      message: "Weather provider returned invalid JSON",
      statusCode: 502
    });
  });

  it("should return 502 when the provider response has an unexpected structure", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        hourly: {
          time: "not-an-array",
          temperature_2m: []
        }
      })
    });

    await expect(
      getSiteWeatherForecast(siteId)
    ).rejects.toMatchObject({
      message: "Weather provider returned an unexpected response",
      statusCode: 502
    });
  });

  it("should reject hourly arrays with mismatched lengths", async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      timezone: "GMT",
      hourly: {
        time: ["2026-10-10T00:00", "2026-10-10T01:00"],
        temperature_2m: [24.5, 25.1],
        relative_humidity_2m: [100],
        cloud_cover: [100, 80],
        wind_speed_10m: [0.71, 1.34],
        shortwave_radiation: [0, 13]
      }
    })
  });

    await expect(
        getSiteWeatherForecast(siteId)
    ).rejects.toMatchObject({
        message: "Weather provider returned an unexpected response",
        statusCode: 502
    });
    });

  it("should map a successful hourly forecast response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        timezone: "GMT",
        hourly: {
          time: [
            "2026-10-10T00:00",
            "2026-10-10T01:00"
          ],
          temperature_2m: [24.5, 25.1],
          relative_humidity_2m: [100, 95],
          cloud_cover: [100, 80],
          wind_speed_10m: [0.71, 1.34],
          shortwave_radiation: [0, 13]
        }
      })
    });

    const result = await getSiteWeatherForecast(siteId);

    expect(result.siteId).toBe(siteId);
    expect(result.provider).toBe("Open-Meteo");
    expect(result.timezone).toBe("GMT");
    expect(result.latitude).toBe(6.9271);
    expect(result.longitude).toBe(79.8612);

    expect(result.forecast).toHaveLength(2);

    expect(result.forecast[0]).toEqual({
      recordedAt: "2026-10-10T00:00:00Z",
      temperatureC: 24.5,
      humidityPercent: 100,
      cloudCoverPercent: 100,
      windSpeedMs: 0.71,
      irradianceWM2: 0
    });

    expect(result.forecast[1].recordedAt).toBe(
      "2026-10-10T01:00:00Z"
    );

    expect(fetchMock).toHaveBeenCalledOnce();

    const requestedUrl = new URL(fetchMock.mock.calls[0][0]);

    expect(requestedUrl.hostname).toBe("api.open-meteo.com");
    expect(requestedUrl.searchParams.get("timezone")).toBe("UTC");
    expect(requestedUrl.searchParams.get("forecast_days")).toBe("2");
  });
});