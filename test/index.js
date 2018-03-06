const assert = require('assert')
const parse = require('..')
const Joi = parse.Joi

function simpleTest (input, output, definitions) {
  const result = parse(input)

  assert.deepEqual(result.swagger, output)

  if (definitions) {
    assert.deepEqual(result.definitions, definitions)
  }
}

describe('swagger converts', () => {
  describe('test joi.number', () => {
    it('test min & max', () => {
      simpleTest(Joi.number().integer().min(1).max(10), {
        type: 'integer',
        maximum: 10,
        minimum: 1
      })
    })
    it('test positive', () => {
      simpleTest(Joi.number().positive(), {
        type: 'number',
        format: 'float',
        minimum: 1
      })
    })
    it('test precision & negative', () => {
      simpleTest(Joi.number().precision(2).negative(), {
        type: 'number',
        format: 'double',
        maximum: -1
      })
    })
  })

  describe('test joi.string', () => {
    it('test string', () => {
      simpleTest(Joi.string(), {
        type: 'string'
      })
    })
    it('test min & max', () => {
      simpleTest(Joi.string().min(4).max(9), {
        type: 'string',
        maxLength: 9,
        minLength: 4
      })
    })
    it('test min & max > length', () => {
      simpleTest(Joi.string().min(4).max(9).length(14), {
        type: 'string',
        maxLength: 14,
        minLength: 14
      })
    })
    it('test max > length > min', () => {
      simpleTest(Joi.string().max(9).length(14).min(4), {
        type: 'string',
        maxLength: 14,
        minLength: 4
      })
    })
    it('test alphanum', () => {
      simpleTest(Joi.string().alphanum(), {
        type: 'string',
        pattern: '^[a-zA-Z0-9]*$'
      })
    })
    it('test alphanum strict lowercase', () => {
      simpleTest(Joi.string().strict().alphanum().lowercase(), {
        type: 'string',
        pattern: '^[a-z0-9]*$'
      })
    })
    it('test alphanum uppercase', () => {
      simpleTest(Joi.string().alphanum().uppercase(), {
        type: 'string',
        pattern: '^[a-zA-Z0-9]*$'
      })
    })
    it('test alphanum strict uppercase', () => {
      simpleTest(Joi.string().strict().alphanum().uppercase(), {
        type: 'string',
        pattern: '^[A-Z0-9]*$'
      })
    })
    it('test email', () => {
      simpleTest(Joi.string().email(), {
        type: 'string',
        format: 'email'
      })
    })
    it('test date-time', () => {
      simpleTest(Joi.string().isoDate(), {
        type: 'string',
        format: 'date-time'
      })
    })
    it('test enum', () => {
      simpleTest(Joi.string().valid('A', 'B', 'C', null), {
        type: 'string',
        enum: ['A', 'B', 'C'],
        'x-nullable': true
      })
    })
  })

  describe('test boolean', () => {
    it('test boolean', () => {
      simpleTest(Joi.boolean(), {
        type: 'boolean'
      })
    })
    it('test boolean with null', () => {
      simpleTest(Joi.boolean().allow(null), {
        type: 'boolean',
        'x-nullable': true
      })
    })
  })

  describe('test binary', () => {
    it('test binary', () => {
      simpleTest(Joi.binary(), {
        type: 'string',
        format: 'binary'
      })
    })
    it('test binary base64', () => {
      simpleTest(Joi.binary().encoding('base64'), {
        type: 'string',
        format: 'byte'
      })
    })
  })

  describe('test array', () => {
    it('test array items', () => {
      simpleTest(Joi.array().items(Joi.boolean(), Joi.date()), {
        type: 'array',
        items: { type: 'boolean' }
      })
    })
    it('test array unique', () => {
      simpleTest(Joi.array().items(Joi.string()).unique(), {
        type: 'array',
        uniqueItems: true,
        items: { type: 'string' }
      })
    })
    it('test array swaggerIndex item', () => {
      simpleTest(Joi.array().items(Joi.string(), Joi.number()).meta({ swaggerIndex: 1 }).min(1).max(5), {
        type: 'array',
        items: {
          type: 'number',
          format: 'float'
        },
        minItems: 1,
        maxItems: 5
      })
    })
  })

  describe('test alternatives', () => {
    it('test alternatives', () => {
      simpleTest(Joi.alternatives(Joi.string(), Joi.number()).meta({ swaggerIndex: 1 }), {
        type: 'number',
        format: 'float'
      })
    })

    it('test when', () => {
      simpleTest(Joi.when('requiredField', {
        is: true,
        then: Joi.string(),
        otherwise: Joi.number()
      }), {
        type: 'string'
      })
    })

    it('test when with swaggerIndex', () => {
      simpleTest(Joi.when('requiredField', {
        is: true,
        then: Joi.string(),
        otherwise: Joi.number()
      }).meta({ swaggerIndex: 1 }), {
        type: 'number',
        format: 'float'
      })
    })
  })

  describe('test object', () => {
    it('test object required forbidden', () => {
      simpleTest(Joi.object().keys({
        req: Joi.string().required(),
        forbiddenString: Joi.string().forbidden(),
        forbiddenNumber: Joi.number().forbidden(),
        forbiddenBoolean: Joi.boolean().forbidden(),
        forbiddenBinary: Joi.binary().forbidden(),
        marybeForbidden: Joi.number().when('someField', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }).meta({ swaggerIndex: 1 })
      }), {
        type: 'object',
        required: ['req'],
        properties: {
          req: { type: 'string' }
        }
      })
    })
    it('test object required', () => {
      simpleTest(Joi.object().keys({
        id: Joi.number().integer().required(),
        name: Joi.string()
      }), {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' }
        }
      })
    })
    it('test object within object', () => {
      simpleTest(Joi.object().keys({
        name: Joi.string(),
        settings: Joi.object()
      }), {
        type: 'object',
        properties: {
          name: { type: 'string' },
          settings: { type: 'object', properties: {} }
        }
      })
    })
    it('test object forbidden unknown keys', () => {
      simpleTest(Joi.object().keys({
        value: Joi.string().default('salak')
      }).unknown(false), {
        type: 'object',
        additionalProperties: false,
        properties: {
          value: {
            type: 'string',
            default: 'salak'
          }
        }
      })
    })
  })
  describe('test meta', () => {
    it('test meta: className', () => {
      simpleTest(Joi.string().alphanum().email().meta({ className: 'Email' }), {
        $ref: '#/definitions/Email'
      }, {
        Email: {
          type: 'string',
          format: 'email'
        }
      })
    })
  })
})
