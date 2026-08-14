import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const prohibitedKeys = new Set([
  'evidence', 'evidenceReferences', 'privateLocators', 'openQuestions',
  'internalNotes', 'secrets', 'humanApproval', 'publicationPermission',
  'traceability', 'facts', 'technicalMetadata'
]);

export function validatePublicProjection(schema, projection) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(projection)) return validate.errors;
  const visit = value => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (prohibitedKeys.has(key)) throw new Error(`Prohibited private field: ${key}`);
        visit(child);
      }
    }
  };
  visit(projection);
  const valueIds = projection.values.map(({ id }) => id);
  if (new Set(valueIds).size !== valueIds.length) throw new Error('Duplicate public value identifier');
  const expected = JSON.stringify([...valueIds].sort());
  for (const channel of ['site', 'cv']) {
    const ids = projection.representations[channel].map(({ factId }) => factId);
    if (new Set(ids).size !== ids.length || JSON.stringify([...ids].sort()) !== expected) {
      throw new Error(`${channel} representations must reference every public value exactly once`);
    }
  }
  return [];
}
