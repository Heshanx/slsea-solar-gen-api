-- Each installation can have only one generation reading per timestamp.
CREATE UNIQUE INDEX solar_generation_site_recorded_at_unique
    ON public.solar_generation (site_id, recorded_at);

-- Each installation can have only one weather record per timestamp.
CREATE UNIQUE INDEX weather_data_site_recorded_at_unique
    ON public.weather_data (site_id, recorded_at);