const { get } = require('lodash')

exports.meta = (schema, key) => {
  const flattened = Object.assign.apply(null, [{}].concat(schema._meta))

  return get(flattened, key)
}

exports.refDef = (name) => {
  return { $ref: '#/definitions/' + name }
}

exports.checkForbidden = (schema) => {
  return get(schema, '_flags.presence') === 'forbidden'
}
