const Joi = require('joi')
const types = require('./types')
const { meta, refDef, checkForbidden } = require('./tools')
const { get } = require('lodash')

module.exports = (schema, existingDefinitions) => {
  if (!schema) {
    throw new Error('No schema was passed.')
  }

  if (typeof schema === 'object' && !schema.isJoi) {
    schema = Joi.object().keys(schema)
  }

  if (!schema.isJoi) {
    throw new TypeError('Passed schema does not appear to be a joi schema.')
  }

  const override = meta(schema, 'swagger')
  if (override && meta(schema, 'swaggerOverride')) {
    return {
      swagger: override,
      definitions: {}
    }
  }

  const metaDefName = meta(schema, 'className')

  if (metaDefName && existingDefinitions && existingDefinitions[metaDefName]) {
    return {
      swagger: refDef(metaDefName)
    }
  }

  let swagger
  const definitions = {}

  if (types[schema._type]) {
    swagger = types[schema._type](schema, existingDefinitions, definitions)
  } else {
    throw new TypeError(`${schema._type} is not a supported Joi type.`)
  }

  /*
  if (schema._valids && schema._valids.has(null)) {
    swagger.type = [ swagger.type, 'null' ]
  }
  */

  if (schema._description) {
    swagger.description = schema._description
  }

  const defaultValue = get(schema, '_flags.default')
  if (defaultValue) {
    swagger.default = defaultValue
  }

  if (metaDefName) {
    definitions[metaDefName] = swagger

    return {
      swagger: refDef(metaDefName),
      definitions
    }
  }

  if (override) {
    Object.assign(swagger, override)
  }

  if (checkForbidden(schema)) {
    return false
  }

  return {
    swagger,
    definitions
  }
}
