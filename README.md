# salak-joi-to-swagger

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![David deps][david-image]][david-url]
[![NPM download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/salak-joi-to-swagger.svg?style=flat-square
[npm-url]: https://npmjs.org/package/salak-joi-to-swagger
[travis-image]: https://img.shields.io/travis/SalakJS/salak-joi-to-swagger.svg?style=flat-square
[travis-url]: https://travis-ci.org/SalakJS/salak-joi-to-swagger
[david-image]: https://img.shields.io/david/SalakJS/salak-joi-to-swagger.svg?style=flat-square
[david-url]: https://david-dm.org/SalakJS/salak-joi-to-swagger
[download-image]: https://img.shields.io/npm/dm/salak-joi-to-swagger.svg?style=flat-square
[download-url]: https://npmjs.org/package/salak-joi-to-swagger

> Convert Joi schema to Swagger definitions

## Installation

Install using [npm](https://www.npmjs.org/):

```sh
npm install --save salak-joi-to-swagger
```

## Usage

```javascript
const j2s = require('salak-joi-to-swagger')

const { swagger, definitions } = j2s(schema, existingDefinitions)
```

## Supported Convertions

- Joi.string()
- Joi.number()
- Joi.boolean()
- Joi.binary()
- Joi.date()
- Joi.alternatives()
- Joi.array()
- Joi.object()

## License

MIT
