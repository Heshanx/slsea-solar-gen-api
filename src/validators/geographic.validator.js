import { z } from "zod";

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

const emptyBody = z.object({});
const emptyQuery = z.object({});
const idParams = z.object({
  id: z.string().uuid("Invalid resource ID")
});

export const listProvincesSchema = z.object({
  body: emptyBody,
  params: emptyQuery,
  query: pageQuery
});

export const getProvinceSchema = z.object({
  body: emptyBody,
  params: idParams,
  query: emptyQuery
});

export const listProvinceDistrictsSchema = z.object({
  body: emptyBody,
  params: idParams,
  query: pageQuery
});

export const getDistrictSchema = getProvinceSchema;

export const listDistrictSubstationsSchema = z.object({
  body: emptyBody,
  params: idParams,
  query: pageQuery
});

export const getSubstationSchema = getProvinceSchema;

export const listSubstationInstallationsSchema = z.object({
  body: emptyBody,
  params: idParams,
  query: pageQuery
});
