import { z } from "zod";
export const readingsSchema = z.object({
  body: z.object({}), params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    provinceId: z.string().uuid().optional(), districtId: z.string().uuid().optional(),
    substationId: z.string().uuid().optional(), installationId: z.string().uuid().optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(), sort: z.enum(['asc','desc']).default('desc')
  })
}).refine(x => !x.query.from || !x.query.to || new Date(x.query.from) <= new Date(x.query.to),
 { message: 'from must be before or equal to to', path: ['query','from'] });
