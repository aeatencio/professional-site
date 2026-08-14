import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validatePublicProjection } from '../lib/public-projection.mjs';

const schemaPath = resolve('contracts/professional-public-projection.v1.schema.json');
const projectionPath = resolve('data/professional-public-projection.v1.json');
const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
const projection = JSON.parse(await readFile(projectionPath, 'utf8'));
const errors = validatePublicProjection(schema, projection);
if (errors.length) throw new Error(`Public projection is invalid: ${JSON.stringify(errors)}`);
console.log(`Validated public projection: ${projectionPath}`);
