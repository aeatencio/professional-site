import type { EvidenceId } from '../../src/data/professional/schema';

/** Internal metadata. Public Astro code must not import this catalog. */
export interface EvidenceReference {
  id: EvidenceId;
  kind: 'document' | 'link' | 'first-party-confirmation' | 'other';
  privateLocator: string;
}

export interface EvidenceCatalog {
  references: readonly EvidenceReference[];
}
