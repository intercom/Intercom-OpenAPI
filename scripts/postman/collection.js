// Based on the Box implementation
// https://github.com/box/box-postman

const uuid = require('uuid');
const { URL } = require('url');
const { resolve } = require('path');
const { uniq } = require('lodash');
const Example = require('./example');
const VERB_PRIORITY = ['GET', 'POST', 'PUT', 'DELETE'];
const createCollectionFromYaml = require('./create-collection-from-yaml');
const fs = require('fs');
const path = require('path');

const byName = (a, b) => {
  if (a.name < b.name) {
    return -1;
  } else if (a.name > b.name) {
    return 1;
  }
  return 0;
};

module.exports = class Collection {
  constructor(openapi) {
    this.openapi = openapi;
    this.folders = []; // Initialize folders array
    this.tags = {}; // Initialize tags object
  }

  async createCompleteCollection() {
    return {
      info: this.getInfo(),
      item: this.getItems(),
      event: [],
      variable: this.getVariables(),
      auth: this.defaultAuth(),
    };
  }

  getInfo() {
    return {
      name: `${this.openapi.info.title} - ${this.openapi.info.version}`,
      description: this.openapi.info.description,
      version: `${this.openapi.info.version}`,
      contact: this.openapi.info.contact,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    };
  }

  getVariables() {
    // Only include the bearer token variable
    return [
      {
        id: uuid.v4(),
        key: 'bearerToken',
        value: '{{bearerToken}}',
        type: 'string',
        description: 'bearertokenvalue',
      },
    ];
  }

  defaultAuth() {
    return {
      type: 'bearer',
      bearer: [
        {
          key: 'bearerToken',
          value: '{{bearerToken}}',
          type: 'string',
        },
        {
          key: 'tokenType',
          value: 'bearer',
          type: 'string',
        },
        {
          key: 'addTokenTo',
          value: 'header',
          type: 'string',
        },
      ],
    };
  }

  getItems() {
    this.createFolders();
    this.insertEndpoints();
    this.pruneEmptyFolders();
    this.sortVerbs();
    return this.folders;
  }

  createFolders() {
    this.folders = [];
    this.openapi.tags.sort(byName).forEach((tag) => {
      const folder = {
        name: tag.name,
        item: [],
      };
      this.folders.push(folder);
    });
    // Creating a folder for endpoints without tags
    this.folders.push({
      name: 'Uncategorized',
      item: [],
    });
  }

  insertEndpoints() {
    Object.entries(this.openapi.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, endpoint]) => {
        if (method !== 'parameters') {
          const request = this.request(method, path, endpoint);
          this.insertEndpoint({
            name: endpoint.summary || path,
            tags: endpoint.tags || [], // Include the tags from the OpenAPI spec
            request: request,
            response: [], // Initialize responses array
          });
        }
      });
    });
  }

  insertEndpoint(endpoint) {
    try {
      // Get folder name from tags or default to 'General'
      const folderName = endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags[0] : 'General';

      const folder = this.findFolder(folderName);
      if (!folder.item) {
        folder.item = []; // Ensure item is an array
      }
      folder.item.push(endpoint);
    } catch (err) {
      console.warn(
        `Warning: Could not insert endpoint ${endpoint.name || 'unknown'}:`,
        err.message,
      );
      // Add to General folder as fallback
      const generalFolder = this.findFolder('General');
      if (!generalFolder.item) {
        generalFolder.item = [];
      }
      generalFolder.item.push(endpoint);
    }
  }

  request(verb, path, endpoint) {
    return {
      url: this.url(path, endpoint),
      auth: this.defaultAuth(),
      method: verb.toUpperCase(),
      description: endpoint.description,
      header: this.header(endpoint),
      body: this.body(endpoint),
    };
  }

  url(path, endpoint) {
    const baseUrl = 'https://api.intercom.io';

    // Ensure path starts with a slash if it doesn't already
    const formattedPath = path.startsWith('/') ? path : `/${path}`;

    return {
      raw: `${baseUrl}${formattedPath}`,
      protocol: 'https',
      host: ['api.intercom.io'],
      path: formattedPath.split('/').filter((p) => p),
      query: this.query(endpoint),
      variable: this.variable(endpoint),
    };
  }

  path(server, path) {
    const result = resolve(`${server.pathname}${path}`);
    return result.replace(/\{(.*?)\}/g, ':$1').split('#')[0];
  }

  query(endpoint) {
    if (!endpoint.parameters) {
      return [];
    }

    return endpoint.parameters
      .filter((param) => param.in === 'query')
      .map((param) => ({
        key: param.name,
        value: this.fetchExample(param),
        description: param.description,
      }));
  }

  variable(endpoint) {
    if (!endpoint.parameters) {
      return [];
    }
    return endpoint.parameters
      .filter((param) => param.in === 'path')
      .map((param) => ({
        key: param.name,
        value: this.fetchExample(param),
        disabled: !param.required,
        description: param.description,
      }));
  }

  header(endpoint) {
    let headers = [];

    if (endpoint.parameters) {
      headers = endpoint.parameters
        .filter((param) => param.in === 'header')
        .map((param) => ({
          key: param.name,
          value: this.fetchExample(param),
          description: param.description,
        }));
    }
    headers
      .filter((o) => o.key === 'Intercom-Version')
      ?.map((o) => (o.value = this.openapi.info.version));
    if (endpoint.requestBody && endpoint.requestBody.content) {
      headers.push({
        key: 'Content-Type',
        value: Object.keys(endpoint.requestBody.content)[0],
      });
    }

    headers.push({
      key: 'Accept',
      value: 'application/json',
    });

    return headers;
  }

  body(endpoint) {
    if (!(endpoint.requestBody && endpoint.requestBody.content)) {
      return null;
    }

    const [contentType, content] = Object.entries(endpoint.requestBody.content)[0];

    return {
      mode: this.mode(contentType),
      raw: this.raw(content, contentType),
      urlencoded: this.urlencoded(content, contentType),
      formdata: this.formdata(content, contentType),
    };
  }

  mode(contentType) {
    const mapping = {
      'application/x-www-form-urlencoded': 'urlencoded',
      'multipart/form-data': 'formdata',
      'application/octet-stream': 'file',
      'application/json': 'raw',
      'application/json-patch+json': 'raw',
    };
    return mapping[contentType];
  }

  raw(content, contentType) {
    if (this.mode(contentType) !== 'raw' || !content.schema || !content.schema.properties) {
      return;
    }
    return new Example(content.schema, this.openapi).stringify();
  }

  urlencoded(content, contentType) {
    if (this.mode(contentType) !== 'urlencoded' || !content.schema || !content.schema.properties) {
      return [];
    }

    return Object.entries(content.schema.properties).map(([key, prop]) => ({
      key: key,
      value: this.serialize(key, prop.example),
      disabled: !content.schema.required.includes(key),
      description: prop.description,
    }));
  }

  formdata(content, contentType) {
    if (this.mode(contentType) !== 'formdata' || !content.schema || !content.schema.properties) {
      return [];
    }

    return Object.entries(content.schema.properties).map(([key, prop]) => {
      const type = prop.format === 'binary' ? 'file' : 'text';
      const value = type === 'file' ? null : new Example(prop, this.openapi).stringify();
      const required = content.schema.required && content.schema.required.includes(key);

      return {
        key: key,
        value: this.serialize(key, value),
        disabled: !required,
        type: type,
        description: prop.description,
      };
    });
  }

  fetchExample(param) {
    if (param.value) {
      return String(param.value);
    } else if (param.example) {
      return String(param.example);
    }
    return param.name;
  }

  findFolder(folderName) {
    // Handle case where folderName is undefined or null
    if (!folderName) {
      folderName = 'General';
    }

    // Find existing folder or create new one
    let folder = this.folders.find((f) => f.name === folderName);
    if (!folder) {
      folder = {
        name: folderName,
        item: [], // Initialize item as array
      };
      this.folders.push(folder);
    }
    return folder;
  }

  pruneEmptyFolders() {
    this.folders = this.folders.filter((folder) => !folder.item || folder.item.length > 0);
  }

  sortVerbs() {
    this.folders.forEach((folder) => {
      if (folder.item) {
        folder.item.sort(
          (a, b) =>
            VERB_PRIORITY.indexOf(a.request.method) - VERB_PRIORITY.indexOf(b.request.method),
        );
      }
      return folder;
    });
  }
};
