import * as geographicService from "../services/geographic.service.js";
import { mapSolarSite } from "../utils/mappers/solar-site.mapper.js";
import { sendConditionalJson } from "../utils/conditional-response.js";

const mapProvince = (province) => ({
  id: province.id,
  code: province.code,
  name: province.name,
  createdAt: province.created_at
});

const mapDistrict = (district) => ({
  id: district.id,
  code: district.code,
  name: district.name,
  province: {
    id: district.province_id,
    code: district.province_code,
    name: district.province_name
  },
  createdAt: district.created_at
});

const mapSubstation = (substation) => ({
  id: substation.id,
  code: substation.code,
  name: substation.name,
  latitude: substation.latitude === null
    ? null
    : Number(substation.latitude),
  longitude: substation.longitude === null
    ? null
    : Number(substation.longitude),
  voltageKv: substation.voltage_kv === null
    ? null
    : Number(substation.voltage_kv),
  isActive: substation.is_active,
  district: {
    id: substation.district_id,
    name: substation.district_name
  },
  province: {
    id: substation.province_id,
    code: substation.province_code,
    name: substation.province_name
  },
  createdAt: substation.created_at
});

const pagination = (req, page, limit, total) => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const link = (targetPage) => {
    if (targetPage < 1 || targetPage > totalPages) return null;
    const url = new URL(req.originalUrl, "http://localhost");
    url.search = "";
    url.searchParams.set("page", String(targetPage));
    url.searchParams.set("limit", String(limit));
    return `${url.pathname}${url.search}`;
  };
  return {
    page,
    limit,
    total,
    totalPages,
    next: link(page + 1),
    previous: link(page - 1)
  };
};

const sendCollection = (req, res, result, mapper) => {
  const { page, limit } = req.validated.query;
  return sendConditionalJson(req, res, {
    success: true,
    data: result.data.map(mapper),
    pagination: pagination(req, page, limit, result.total)
  });
};

const sendItem = (req, res, resource, mapper) => {
  return sendConditionalJson(req, res, {
    success: true,
    data: mapper(resource)
  }, resource.updated_at ?? resource.created_at);
};

export const getProvinces = async (req, res, next) => {
  try {
    const result = await geographicService.getProvinces({
      ...req.validated.query,
      jurisdiction: req.auth.jurisdiction
    });
    sendCollection(req, res, result, mapProvince);
  } catch (error) {
    next(error);
  }
};

export const getProvince = async (req, res, next) => {
  try {
    const province = await geographicService.getProvinceById(
      req.validated.params.id,
      req.auth.jurisdiction
    );
    sendItem(req, res, province, mapProvince);
  } catch (error) {
    next(error);
  }
};

export const getProvinceDistricts = async (req, res, next) => {
  try {
    const result = await geographicService.getDistrictsByProvince(
      req.validated.params.id,
      req.validated.query,
      req.auth.jurisdiction
    );
    sendCollection(req, res, result, mapDistrict);
  } catch (error) {
    next(error);
  }
};

export const getDistrict = async (req, res, next) => {
  try {
    const district = await geographicService.getDistrictById(
      req.validated.params.id,
      req.auth.jurisdiction
    );
    sendItem(req, res, district, mapDistrict);
  } catch (error) {
    next(error);
  }
};

export const getDistrictSubstations = async (req, res, next) => {
  try {
    const result = await geographicService.getSubstationsByDistrict(
      req.validated.params.id,
      req.validated.query,
      req.auth.jurisdiction
    );
    sendCollection(req, res, result, mapSubstation);
  } catch (error) {
    next(error);
  }
};

export const getSubstation = async (req, res, next) => {
  try {
    const substation = await geographicService.getSubstationById(
      req.validated.params.id,
      req.auth.jurisdiction
    );
    sendItem(req, res, substation, mapSubstation);
  } catch (error) {
    next(error);
  }
};

export const getSubstationInstallations = async (req, res, next) => {
  try {
    const result = await geographicService.getInstallationsBySubstation(
      req.validated.params.id,
      req.validated.query,
      req.auth.jurisdiction
    );
    sendCollection(req, res, result, mapSolarSite);
  } catch (error) {
    next(error);
  }
};
