import * as geographicRepository from "../repositories/geographic.repository.js";
import * as solarSiteRepository from "../repositories/solar-site.repository.js";
import { AppError } from "../utils/AppError.js";

const missing = (resource) => new AppError(`${resource} not found`, 404);

export const getProvinces = (options) =>
  geographicRepository.findAllProvinces(options);

export const getProvinceById = async (id, jurisdiction) => {
  const province = await geographicRepository.findProvinceById(
    id,
    jurisdiction
  );
  if (!province) throw missing("Province");
  return province;
};

export const getDistrictsByProvince = async (
  provinceId,
  options,
  jurisdiction
) => {
  const province = await geographicRepository.findProvinceById(
    provinceId,
    jurisdiction
  );
  if (!province) throw missing("Province");
  return geographicRepository.findDistrictsByProvince(provinceId, {
    ...options,
    jurisdiction
  });
};

export const getDistrictById = async (id, jurisdiction) => {
  const district = await geographicRepository.findDistrictById(
    id,
    jurisdiction
  );
  if (!district) throw missing("District");
  return district;
};

export const getSubstationsByDistrict = async (
  districtId,
  options,
  jurisdiction
) => {
  const district = await geographicRepository.findDistrictById(
    districtId,
    jurisdiction
  );
  if (!district) throw missing("District");
  return geographicRepository.findSubstationsByDistrict(districtId, {
    ...options,
    jurisdiction
  });
};

export const getSubstationById = async (id, jurisdiction) => {
  const substation = await geographicRepository.findSubstationById(
    id,
    jurisdiction
  );
  if (!substation) throw missing("Substation");
  return substation;
};

export const getInstallationsBySubstation = async (
  substationId,
  options,
  jurisdiction
) => {
  const substation = await geographicRepository.findSubstationById(
    substationId,
    jurisdiction
  );
  if (!substation) throw missing("Substation");
  return solarSiteRepository.findAllBySubstation(substationId, {
    ...options,
    jurisdiction
  });
};
