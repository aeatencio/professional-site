export class PublicProjectionLoadError extends Error {
  stage: string;
  details?: unknown;
}

export interface PublicTextSection {
  heading: string;
  paragraphs: string[];
}

export type PublicContentItem = PublicTextSection;

export interface PublicProjection {
  contract: 'professional-public-projection/v1';
  version: 1;
  publicId: string;
  shared: {
    language: 'en';
    name: string;
    professionalIdentity: string;
    location: string;
    email: string;
    links: Array<{
      label: string;
      url: string;
    }>;
  };
  site: {
    title: string;
    description: string;
    sections: {
      home: {
        paragraphs: string[];
      };
      experience: {
        heading: string;
        paragraphs: string[];
        softwareDevelopment: {
          heading: string;
          roles: Array<{
            organization: string;
            period: string;
            role: string;
            description: string;
          }>;
        };
        currentDevelopment: {
          heading: string;
          paragraphs: string[];
          items: PublicContentItem[];
        };
        teaching: PublicTextSection;
      };
      background: {
        heading: string;
        items: PublicContentItem[];
      };
      workingTogether: PublicTextSection;
      contact: PublicTextSection;
    };
  };
  cv: {
    headline?: string;
    summary?: string[];
    sections?: PublicTextSection[];
  };
}

export function loadPublicProjection(options: {
  schemaPath: string | URL;
  projectionPath: string | URL;
}): Promise<PublicProjection>;

export function loadLocalPublicProjection(): ReturnType<typeof loadPublicProjection>;
