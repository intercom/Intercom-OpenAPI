module.exports = class Example {
  constructor(schema, openapi) {
    this.openapi = openapi;
    this.sample = this.value(schema);
  }

  stringify() {
    return JSON.stringify(this.sample, null, 2);
  }
  generate(props) {
    const output = {};
    Object.entries(props).forEach(([key, prop]) => {
      output[key] = this.value(prop);
    });
    return output;
  }

  value(prop) {
    if (prop.example !== undefined) {
      return prop.example;
    } else if (prop.properties && prop.type !== 'string') {
      return this.generate(prop.properties);
    } else if (prop.type === 'array' && prop.items.oneOf) {
      return this.value(prop.items.oneOf[0]);
    } else if (prop.type === 'array' && prop.items.properties) {
      return [this.value(prop.items)];
    } else if (prop.oneOf) {
      return this.value(prop.oneOf[0]);
    } else if (prop.type === 'string' && prop.enum) {
      return prop.enum[0];
    } else {
      return prop.name || '';
    }
  }
};
