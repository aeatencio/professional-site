export class PublicProjectionLoadError extends Error {
  stage: string;
  details?: unknown;
}

export interface PublicTextSection {
  heading: string;
  paragraphs: string[];
}

export type PublicContentItem = PublicTextSection;

export interface PublicCvTextSection {
  heading: string;
  text: string;
}

export interface PublicCv {
  title: string;
  profile: PublicCvTextSection;
  softwareExperience: {
    heading: string;
    roles: Array<{
      organization: string;
      role: string;
      period: string;
      summary: string;
      technologies: string[];
    }>;
  };
  currentDevelopment: PublicCvTextSection;
  teaching: PublicCvTextSection;
  education: {
    heading: string;
    items: Array<{
      institution: string;
      qualification: string;
      period: string;
      detail?: string;
    }>;
  };
  technicalBackground: {
    heading: string;
    professionalExperience: {
      heading: string;
      items: string[];
    };
    currentPractice: {
      heading: string;
      items: string[];
    };
  };
  languages: {
    heading: string;
    items: Array<{
      language: string;
      proficiency: string;
    }>;
  };
}

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
  cv: PublicCv | Record<string, never>;
}

export function loadPublicProjection(options: {
  schemaPath: string | URL;
  projectionPath: string | URL;
}): Promise<PublicProjection>;

export function loadLocalPublicProjection(): ReturnType<typeof loadPublicProjection>;
