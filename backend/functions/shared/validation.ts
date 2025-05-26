import Joi from 'joi'

export const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
})

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
})

export const filterSchema = Joi.object({
  brands: Joi.array().items(Joi.string()),
  stores: Joi.array().items(Joi.string()),
  products: Joi.array().items(Joi.string()),
  categories: Joi.array().items(Joi.string()),
  regions: Joi.array().items(Joi.string()),
}).unknown(true)

export function validateRequest<T>(
  data: unknown,
  schema: Joi.Schema
): T {
  const { error, value } = schema.validate(data)
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`)
  }
  return value as T
}