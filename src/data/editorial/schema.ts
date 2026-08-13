import type { ProfessionalFact, Projection } from '../professional/schema';

/** A projection selects facts and owns its copy; it does not redefine facts. */
export interface EditorialEntry {
  factId: ProfessionalFact['id'];
  copy: string;
}

export interface EditorialSelection {
  projection: Projection;
  entries: readonly EditorialEntry[];
}
