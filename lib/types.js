const { find, get } = require('lodash')
const { meta, checkForbidden } = require('./tools')

const patterns = {
  alphanum: '^[a-zA-Z0-9]*$',
  alphanumLower: '^[a-z0-9]*$',
  alphanumUpper: '^[A-Z0-9]*$'
}

const types = {}

types.number = (schema) => {
  const swagger = {}

  if (find(schema._tests, { name: 'integer' })) {
    swagger.type = 'integer'
  } else {
    swagger.type = 'number'
    if (find(schema._tests, { name: 'precision' })) {
      swagger.format = 'double'
    } else {
      swagger.format = 'float'
    }
  }

  if (find(schema._tests, { name: 'positive' })) {
    swagger.minimum = 1
  }

  if (find(schema._tests, { name: 'negative' })) {
    swagger.maximum = -1
  }

  const min = find(schema._tests, { name: 'min' })
  if (min) {
    swagger.minimum = min.arg
  }

  const max = find(schema._tests, { name: 'max' })
  if (max) {
    swagger.maximum = max.arg
  }

  const valids = getValids(schema, 'number')

  if (get(schema, '_flags.allowOnly') && valids.length) {
    swagger.enum = valids
  }

  return swagger
}

types.string = (schema) => {
  const swagger = { type: 'string' }

  if (checkForbidden(schema)) {
    return false
  }

  const strict = get(schema, '_settings.convert') === false

  if (find(schema._tests, { name: 'alphanum' })) {
    if (strict && find(schema._tests, { name: 'lowercase' })) {
      swagger.pattern = patterns.alphanumLower
    } else if (strict && find(schema._tests, { name: 'uppercase' })) {
      swagger.pattern = patterns.alphanumUpper
    } else {
      swagger.pattern = patterns.alphanum
    }
  }

  if (find(schema._tests, { name: 'token' })) {
    if (find(schema._tests, { name: 'lowercase' })) {
      swagger.pattern = patterns.alphanumLower
    } else if (find(schema._tests, { name: 'uppercase' })) {
      swagger.pattern = patterns.alphanumUpper
    } else {
      swagger.pattern = patterns.alphanum
    }
  }

  if (find(schema._tests, { name: 'email' })) {
    swagger.format = 'email'
    if (swagger.pattern) {
      delete swagger.pattern
    }
  }

  if (find(schema._tests, { name: 'isoDate' })) {
    swagger.format = 'date-time'
    if (swagger.pattern) {
      delete swagger.pattern
    }
  }

  const pattern = find(schema._tests, { name: 'regex' })
  if (pattern) {
    swagger.pattern = pattern.arg.pattern.toString().slice(1, -1)
  }

  generateMinAndMaxLength(schema, swagger)

  const valids = getValids(schema, 'string')
  if (get(schema, '_flags.allowOnly') && valids.length) {
    swagger.enum = valids
  }

  return swagger
}

types.binary = (schema) => {
  const swagger = {
    type: 'string',
    format: 'binary'
  }

  if (checkForbidden(schema)) {
    return false
  }

  if (get(schema, '_flags.encoding') === 'base64') {
    swagger.format = 'byte'
  }

  generateMinAndMaxLength(schema, swagger)

  return swagger
}

types.date = (schema) => {
  if (checkForbidden(schema)) {
    return false
  }

  return {
    type: 'string',
    format: 'date-time'
  }
}

types.boolean = (schema) => {
  if (checkForbidden(schema)) {
    return false
  }

  return { type: 'boolean' }
}

types.alternatives = (schema, existingDefinitions, newDefinitionsByRef) => {
  const index = meta(schema, 'swaggerIndex') || 0

  const matches = get(schema, ['_inner', 'matches'])
  const firstItem = get(matches, [0])

  let itemsSchema

  if (firstItem && firstItem.ref) {
    itemsSchema = index ? firstItem.otherwise : firstItem.then
  } else if (index) {
    itemsSchema = get(matches, [index, 'schema'])
  } else {
    itemsSchema = firstItem.schema
  }

  const items = require('./parse')(itemsSchema, Object.assign({}, existingDefinitions || {}, newDefinitionsByRef || {}))
  if (get(itemsSchema, '_flags.presence') === 'required') {
    items.swagger.__required = true
  }

  Object.assign(newDefinitionsByRef, items.definitions || {})

  return items.swagger
}

types.array = (schema, existingDefinitions, newDefinitionsByRef) => {
  const index = meta(schema, 'swaggerIndex') || 0
  const itemsSchema = get(schema, ['_inner', 'items', index])

  if (!itemsSchema) {
    throw Error(`Array schema does not define an items schema at index ${index}`)
  }

  if (checkForbidden(schema)) {
    return false
  }

  const items = require('./parse')(itemsSchema, Object.assign({}, existingDefinitions || {}, newDefinitionsByRef || {}))

  Object.assign(newDefinitionsByRef, items.definitions || {})

  const swagger = { type: 'array' }

  for (let i = 0; i < schema._tests.length; i++) {
    const test = schema._tests[i]
    if (test.name === 'min') {
      swagger.minItems = test.arg
    }

    if (test.name === 'max') {
      swagger.maxItems = test.arg
    }

    if (test.name === 'length') {
      swagger.minItems = test.arg
      swagger.maxItems = test.arg
    }
  }

  if (find(schema._tests, { name: 'unique' })) {
    swagger.uniqueItems = true
  }

  swagger.items = items.swagger
  return swagger
}

types.object = (schema, existingDefinitions, newDefinitionsByRef) => {
  const requireds = []
  const properties = {}

  const combinedDefinitions = Object.assign({}, existingDefinitions || {}, newDefinitionsByRef || {})

  const children = get(schema, '_inner.children') || []
  children.forEach((child) => {
    const key = child.key
    const prop = require('./parse')(child.schema, combinedDefinitions)

    if (!prop.swagger) {
      return
    }

    Object.assign(newDefinitionsByRef, prop.definitions || {})
    Object.assign(combinedDefinitions, prop.definitions || {})

    properties[key] = prop.swagger

    if (get(child, 'schema._flags.presence') === 'required' || prop.swagger.__required) {
      requireds.push(key)
      delete prop.swagger.__required
    }
  })

  const swagger = {
    type: 'object',
    properties
  }

  if (requireds.length) {
    swagger.required = requireds
  }

  if (get(schema, '_flags.allowUnknown') === false) {
    swagger.additionalProperties = false
  }

  return swagger
}

function getValids (schema, type) {
  return schema._valids.values().filter((s) => typeof s === type) // eslint-disable-line
}

function generateMinAndMaxLength (schema, swagger) {
  for (let i = 0; i < schema._tests.length; i++) {
    const test = schema._tests[i]
    if (test.name === 'min') {
      swagger.minLength = test.arg
    }

    if (test.name === 'max') {
      swagger.maxLength = test.arg
    }

    if (test.name === 'length') {
      swagger.minLength = test.arg
      swagger.maxLength = test.arg
    }
  }
}

module.exports = types
