import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export function validatePublicProjection(schema, projection) {
  try {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    return validate(projection)
      ? []
      : validate.errors.map(error => ({ stage: 'schema', ...error }));
  } catch (error) {
    return [{
      stage: 'schema',
      message: `Could not compile public projection schema: ${error.message}`
    }];
  }
}
