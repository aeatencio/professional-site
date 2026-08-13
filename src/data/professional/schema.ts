/** Preliminary contract for canonical professional facts. */
export const professionalDomains = [
  'identity',
  'experience',
  'projects',
  'teaching',
  'education',
  'technologies',
  'links',
  'contact',
  'availability',
  'privacy',
] as const;

export type ProfessionalDomain = (typeof professionalDomains)[number];
export type FactualStatus = 'proposed' | 'confirmed' | 'disputed';
export type PublicationPermission = 'private' | 'review-required' | 'publishable';
export type Projection = 'site' | 'cv';
export type EvidenceId = string;
export type IsoDate = `${number}-${number}-${number}`;

export interface PublicationAppearance {
  projection: Projection;
  release: string;
  /** ISO 8601 calendar date in YYYY-MM-DD form. */
  publishedAt: IsoDate;
}

export interface ProfessionalFact<T = unknown> {
  id: string;
  domain: ProfessionalDomain;
  value: T;
  factualStatus: FactualStatus;
  evidenceIds: readonly EvidenceId[];
  publication: PublicationPermission;
  /** Historical appearances only; current inclusion comes from editorial selections. */
  publicationHistory: readonly PublicationAppearance[];
  updatedAt: IsoDate;
}

export interface ProfessionalSource {
  facts: readonly ProfessionalFact[];
}
