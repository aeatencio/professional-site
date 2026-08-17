export class PublicProjectionLoadError extends Error {
  stage: string;
  details?: unknown;
}

export function loadPublicProjection(options: {
  schemaPath: string | URL;
  projectionPath: string | URL;
}): Promise<{
  contract: string;
  version: number;
  publicId: string;
  shared: {
    language: 'en';
    name: string;
    professionalIdentity: string;
  };
  site: {
    title: string;
    description: string;
    sections: {
      home: { paragraphs: string[] };
      experience: { heading: string; paragraphs: string[]; groups?: Array<{ heading: string; paragraphs: string[] }> };
      background: { heading: string; paragraphs: string[]; groups?: Array<{ heading: string; paragraphs: string[] }> };
      workingTogether: { heading: string; paragraphs: string[]; groups?: Array<{ heading: string; paragraphs: string[] }> };
      contact: { heading: string; paragraphs: string[]; groups?: Array<{ heading: string; paragraphs: string[] }> };
    };
  };
  cv: {
    headline?: string;
    summary?: string[];
    sections?: Array<{ heading: string; paragraphs: string[] }>;
  };
}>;

export function loadLocalPublicProjection(): ReturnType<typeof loadPublicProjection>;
