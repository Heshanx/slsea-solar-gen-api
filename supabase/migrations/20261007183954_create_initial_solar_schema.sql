create table public.solar_sites (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    location text,
    latitude numeric(9,6),
    longitude numeric(9,6),
    capacity_kw numeric(12,3) not null,
    timezone text not null default 'Asia/Colombo',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint solar_sites_capacity_positive
        check (capacity_kw > 0),

    constraint solar_sites_latitude_valid
        check (latitude is null or latitude between -90 and 90),

    constraint solar_sites_longitude_valid
        check (longitude is null or longitude between -180 and 180)
);


create table public.solar_generation (
    id bigint generated always as identity primary key,
    site_id uuid not null references public.solar_sites(id) on delete cascade,
    recorded_at timestamptz not null,
    power_kw numeric(12,3),
    energy_kwh numeric(12,3),
    created_at timestamptz not null default now(),

    constraint solar_generation_power_positive
        check (power_kw is null or power_kw >= 0),

    constraint solar_generation_energy_positive
        check (energy_kwh is null or energy_kwh >= 0)
);


create table public.weather_data (
    id bigint generated always as identity primary key,
    site_id uuid not null references public.solar_sites(id) on delete cascade,
    recorded_at timestamptz not null,
    temperature_c numeric(6,2),
    irradiance_w_m2 numeric(10,2),
    cloud_cover_percent numeric(5,2),
    wind_speed_ms numeric(6,2),
    humidity_percent numeric(5,2),
    created_at timestamptz not null default now(),

    constraint weather_cloud_cover_valid
        check (
            cloud_cover_percent is null
            or cloud_cover_percent between 0 and 100
        ),

    constraint weather_humidity_valid
        check (
            humidity_percent is null
            or humidity_percent between 0 and 100
        ),

    constraint weather_irradiance_positive
        check (
            irradiance_w_m2 is null
            or irradiance_w_m2 >= 0
        )
);


create table public.forecasts (
    id bigint generated always as identity primary key,
    site_id uuid not null references public.solar_sites(id) on delete cascade,
    forecast_time timestamptz not null,
    predicted_power_kw numeric(12,3),
    predicted_energy_kwh numeric(12,3),
    model_version text,
    confidence_score numeric(5,4),
    created_at timestamptz not null default now(),

    constraint forecast_confidence_valid
        check (
            confidence_score is null
            or confidence_score between 0 and 1
        )
);


create index idx_solar_generation_site_time
on public.solar_generation(site_id, recorded_at desc);


create index idx_weather_data_site_time
on public.weather_data(site_id, recorded_at desc);


create index idx_forecasts_site_time
on public.forecasts(site_id, forecast_time desc);


create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


create trigger solar_sites_updated_at
before update on public.solar_sites
for each row
execute function public.update_updated_at();


alter table public.solar_sites enable row level security;
alter table public.solar_generation enable row level security;
alter table public.weather_data enable row level security;
alter table public.forecasts enable row level security;