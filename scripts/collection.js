const uuid = require('uuid')
const { URL } = require('url')
const { resolve } = require('path')
const { uniq } = require('lodash')

const Example = require('./example')

const VERB_PRIORITY = ['GET', 'POST', 'PUT', 'DELETE']

const byName = (a, b) => {
  if (a.name < b.name) {
    return -1
  } else if (a.name > b.name) {
    return 1
  }
  return 0
}


module.exports = class Collection {

  constructor (openapi, collection_items = null) {
    this.collection_items = collection_items
    this.openapi = openapi
  }


  generateItemsForDifferentServers(){
    let items = []
    this.openapi.servers.forEach(server => {
      let server_folder = {
        name: server.description,
        item: [],
      }
      let collection = this.getItems(server.url)
      collection.forEach((c) => {
        server_folder.item.push(c);
      });
      items.push(server_folder)
    })
    return items
  }

  async createCompleteCollection(){
    return {
      info: this.getInfo(),
      item: this.collection_items,
      event: [],
      variable: this.getVariables(),
      auth: this.defaultAuth()
    }
  }
  // PRIVATE

  /**
   * Creates the info object
   */
  getInfo () {
    return {
      name: `${this.openapi.info.title}`,
      _postman_id: uuid.v4(),
      description: this.openapi.info.description,
      version: '',
      contact: this.openapi.info.contact?.url,
      schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    }
  }

  getItems (serverURL) {
    this.createFolders()
    this.insertEndpoints(serverURL)
    this.pruneEmptyFolders()
    this.sortVerbs()
    return this.folders
  }

  getVariables () {
    let variables = uniq(Object.values(this.openapi.servers).map(host => ({
      id: uuid.v4(),
      key: host.url,
      value: host.url,
      type: 'string',
      description: host.description
    })))
    let tokenInfo = { 
      id: uuid.v4(),
      key: 'bearerToken',
      value: '{{bearerToken}}',
      type: 'string',
      description: 'bearertokenvalue' 
    }
    variables.push(tokenInfo)
    return variables;
  }

  /**
   * Creates a folder tree based on our reference
   * tags
   */
  createFolders () {
    this.folders = []

    // for every nested tag create a folder object and place it on the root folder
    this.openapi.tags.sort(byName).forEach(tag => {
      // only append subfolders in openapi
      const folder = {
        name: tag.name,
        item: []
      }

      this.folders.push(folder)
    })
  }

  insertEndpoints (serverURL) {
    const paths = Object.keys(this.openapi.paths)
    paths.forEach(path => {
      const endpoints = this.openapi.paths[path]
      const verbs = Object.keys(endpoints)
      verbs.forEach(verb => this.insertEndpoint(verb, path, endpoints[verb],serverURL))
    })
  }

  insertEndpoint (verb, path, endpoint,serverURL) {
    const item = {
      id: uuid.v4(),
      name: endpoint.summary, 
      description: endpoint.description,
      request: this.request(verb, path, endpoint,serverURL),
    }
    const parent = this.findFolder(endpoint)
    parent.push(item)
  }

  pruneEmptyFolders () {
    this.folders = this.folders.filter(folder => !folder.item || folder.item.length > 0)
  }

  sortVerbs () {
    this.folders.forEach(folder => {
      if (folder.item) {
        folder.item.sort((a, b) => VERB_PRIORITY.indexOf(a.request.method) - VERB_PRIORITY.indexOf(b.request.method))
      }
      return folder
    })
  }

  request (verb, path, endpoint, serverURL) {
    return {
      url: this.url(path, endpoint, serverURL),
      auth: this.defaultAuth(),
      method: verb.toUpperCase(),
      description: endpoint.description,
      header: this.header(endpoint),
      body: this.body(endpoint)
    }
  }

  url (path, endpoint,serverURL) {
    const server = new URL(serverURL)
    return {
      protocol: 'https',
      host: `{{${server.host}}}`,
      path: this.path(server, path),
      query: this.query(endpoint),
      variable: this.variable(endpoint)
    }
  }

  path (server, path) {
    const result = resolve(`${server.pathname}${path}`)
    return result.replace(/\{(.*?)\}/g, ':$1').split('#')[0]
  }


  query (endpoint) {
    if (!endpoint.parameters) { return [] }

    return endpoint.parameters
      .filter(param => param.in === 'query')
      .map(param => ({
        key: param.name,
        value: this.fetchExample(param),
        description: param.description
      }))
  }

  serialize (value, explode = true) {
    if (!explode && Array.isArray(value)) {
      return value.join(',')
    } else if (typeof value === 'object' && value !== null && value !== undefined) {
      return JSON.stringify(value)
    } else if (value !== null && value !== undefined) {
      return String(value)
    } else {
      return ''
    }
  }

  variable (endpoint) {
    if (!endpoint.parameters) { return [] }
    return endpoint.parameters
      .filter(param => param.in === 'path')
      .map(param => ({
        key: param.name,
        value: this.fetchExample(param),
        disabled: !param.required,
        description: param.description
      }))
  }

  header (endpoint) {
    let headers = []

    if (endpoint.parameters) {
      headers = endpoint.parameters
        .filter(param => param.in === 'header')
        .map(param => ({
          key: param.name,
          value: this.fetchExample(param),
          description: param.description
        }))
    }
    headers.filter(o => o.key === 'Intercom-Version')?.map( o => o.value= this.openapi.info.version)
    if (endpoint.requestBody && endpoint.requestBody.content) {
      headers.push({
        key: 'Content-Type',
        value: Object.keys(endpoint.requestBody.content)[0]
      })
    }
    
    headers.push({
      key: 'Accept',
      value: 'application/json'
    })
  
    return headers
  }

  defaultAuth () {
    return {
      type: 'bearer',
      bearer: [
        {
          key: 'bearerToken',
          value: '{{bearerToken}}',
          type: 'string'
        },
        {
          key: 'tokenType',
          value: 'bearer',
          type: 'string'
        },
        {
          key: 'addTokenTo',
          value: 'header',
          type: 'string'
        }
      ]
    }
  }

  body (endpoint) {
    if (!(endpoint.requestBody && endpoint.requestBody.content)) { return null }

    const [contentType, content] = Object.entries(endpoint.requestBody.content)[0]

    return {
      mode: this.mode(contentType),
      raw: this.raw(content, contentType),
      urlencoded: this.urlencoded(content, contentType),
      formdata: this.formdata(content, contentType)
    }
  }

  mode (contentType) {
    const mapping = {
      'application/x-www-form-urlencoded': 'urlencoded',
      'multipart/form-data': 'formdata',
      'application/octet-stream': 'file',
      'application/json': 'raw',
      'application/json-patch+json': 'raw'
    }
    return mapping[contentType]
  }

  raw (content, contentType) {
    if (this.mode(contentType) !== 'raw' || !content.schema || !content.schema.properties) { return }
    return new Example(content.schema, this.openapi).stringify()
  }

  urlencoded (content, contentType) {
    if (this.mode(contentType) !== 'urlencoded' || !content.schema || !content.schema.properties) { return [] }

    return Object.entries(content.schema.properties)
      .map(([key, prop]) => ({
        key: key,
        value: this.serialize(key, prop.example),
        disabled: !content.schema.required.includes(key),
        description: prop.description
      }))
  }

  formdata (content, contentType) {
    if (this.mode(contentType) !== 'formdata' || !content.schema || !content.schema.properties) { return [] }

    return Object.entries(content.schema.properties).map(([key, prop]) => {
      const type = prop.format === 'binary' ? 'file' : 'text'
      const value = type === 'file' ? null : new Example(prop, this.openapi).stringify()
      const required = content.schema.required && content.schema.required.includes(key)

      return {
        key: key,
        value: this.serialize(key, value),
        disabled: !required,
        type: type,
        description: prop.description
      }
    })
  }

  fetchExample(param){
    if(param.value){
      return String(param.value)
    }else if(param.example){
      return String(param.example)
    }
    return param.name
  }
  /**
   * Finds a folder instance for a given reference category ID
   */
  findFolder (endpoint) {
    const current_tag = endpoint.tags[0]

    // first find the folder name
    const folderName = this.openapi.tags.filter(tag =>
      tag.name === current_tag
    )[0].name

    // return the first folder to match this name
    return this.folders.filter(folder => folder.name === folderName)[0].item
  }

}