import type { IsoDate, ProfessionalFact, Projection } from '../professional/schema';

export type ProjectionReview = Readonly<Record<Projection, true>>;

export interface TechnicalChangeRecord {
  id: string;
  date: IsoDate;
  summary: string;
  affectedFactIds: readonly ProfessionalFact['id'][];
  reviewedProjections: ProjectionReview;
}
