const deepmerge = require('deepmerge');
const { Resolver } = require('@stoplight/json-ref-resolver');
const { JSONPath } = require('jsonpath-plus');

const Collection = require('./collection.js');

module.exports = class OpenAPI {
  constructor(doc) {
    this.openapi = JSON.parse(doc);
    this.tags = {};
  }

  async convert() {
    this.openapi = await this.resolveReferences(this.openapi);
    this.openapi = this.resolveAllOf(this.openapi);
    this.openapi = this.resolveOneOf(this.openapi);
    this.openapi = this.resolveAnyOf(this.openapi);
    let collection = new Collection(this.openapi);
    return await collection.createCompleteCollection();
  }

  // private

  /**
   * Resolves all references in a specification
   */
  async resolveReferences(specification) {
    const references = await new Resolver().resolve(specification).then((res) => res.result);
    // make the object writable again, as somehow the resolved returns a write only object
    return JSON.parse(JSON.stringify(references));
  }

  /**
   * deepmerges all allOf objects
   */
  resolveAllOf(openapi) {
    const paths = new JSONPath({
      path: '$..allOf',
      json: openapi,
      resultType: 'path',
    }).sort((first, second) => second.length - first.length);

    paths.forEach((path) => {
      const parent = new JSONPath({
        path,
        json: openapi,
        resultType: 'parent',
      })[0];

      const allOf = parent.allOf;
      delete parent.allOf;

      const merged = deepmerge.all(allOf);
      Object.entries(merged).forEach(([key, value]) => (parent[key] = value));
    });

    return openapi;
  }

  resolveOneOf(openapi) {
    const paths = new JSONPath({
      path: '$..oneOf',
      json: openapi,
      resultType: 'path',
    }).sort((first, second) => second.length - first.length);

    paths.forEach((path) => {
      const parent = new JSONPath({
        path,
        json: openapi,
        resultType: 'parent',
      })[0];

      const oneOf = parent.oneOf;
      delete parent.oneOf;

      const merged = deepmerge.all(oneOf);
      Object.entries(merged).forEach(([key, value]) => (parent[key] = value));
    });

    return openapi;
  }

  resolveAnyOf(openapi) {
    const paths = new JSONPath({
      path: '$..anyOf',
      json: openapi,
      resultType: 'path',
    }).sort((first, second) => second.length - first.length);

    paths.forEach((path) => {
      const parent = new JSONPath({
        path,
        json: openapi,
        resultType: 'parent',
      })[0];

      const anyOf = parent.anyOf;
      delete parent.anyOf;

      const merged = deepmerge.all(anyOf);
      Object.entries(merged).forEach(([key, value]) => (parent[key] = value));
    });

    return openapi;
  }
};
