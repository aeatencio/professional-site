import projection from '../data/professional-public-projection.v1.json' with { type: 'json' };
import { homeCopy, type HomeCopy, type HomeLanguage } from './home-copy.ts';
import { LOCALIZED_PATHS } from './site-identity.mjs';

type Cv = typeof projection.cv;

export interface CvCopy {
  language: HomeLanguage;
  path: '/cv/' | '/es/cv/';
  shared: HomeCopy['shared'];
  cv: Cv;
  ui: {
    skip: string;
    language: string;
    website: string;
    technologies: string;
    pdfA4: string;
    pdfLetter: string;
  };
}

type RoleTranslation = { role: string; summary: string; highlights?: string[] };
type EducationTranslation = { qualification: string; period: string; detail?: string };
type LanguageTranslation = { language: string; proficiency: string };

// As in the Home copy, projected organization, institution and language names
// and the English list items are the source keys: unknown entries fail.
export const spanishCvRoles = {
  'Manas Technology Solutions': {
    role: 'Desarrollador de software',
    summary: 'Trabajé en productos web y móviles existentes de encuestas, salud y comunidades en línea, en equipos distribuidos que trabajaban en inglés.',
    highlights: [
      'Las tareas partían de necesidades del producto, no de implementaciones ya definidas; colaboré con los responsables de producto en alcance y estimaciones, y definí enfoques técnicos.',
      'Usé ampliamente pruebas automatizadas y TDD para entender el comportamiento actual, reproducir errores y hacer cambios de forma segura en bases de código existentes y complejas.',
      'Implementé cambios en bases de datos y en los datos, incluidas migraciones y SQL, y acompañé algunos de ellos durante el despliegue y la verificación posterior.'
    ]
  },
  'Mobile Streams': {
    role: 'Desarrollador de software',
    summary: 'Trabajé en sistemas web y móviles de suscripción, distribución y descarga de contenido digital, con APIs, integraciones y aplicaciones respaldadas por bases de datos SQL.'
  },
  'RVM Soluciones': {
    role: 'Desarrollador de software',
    summary: 'Desarrollé aplicaciones web y de escritorio, entre ellas sistemas de logística y distribución.'
  }
} satisfies Record<string, RoleTranslation>;

export const spanishCvEducation = {
  'Universidad del Salvador': {
    qualification: 'Analista en Sistemas de Información',
    period: '2017'
  },
  'Universidad de Buenos Aires': {
    qualification: 'Varios años de estudios universitarios',
    period: 'Veterinaria y Letras'
  },
  'IES Juan B. Justo': {
    qualification: 'Formación pedagógica para profesionales y técnicos superiores',
    period: 'En curso',
    detail: '12 de 15 materias aprobadas'
  },
  'Colegio Nacional de Buenos Aires': {
    qualification: 'Bachiller',
    period: 'Colegio preuniversitario de la Universidad de Buenos Aires'
  }
} satisfies Record<string, EducationTranslation>;

export const spanishCvDevelopmentExperience = {
  'Full-stack web development': 'Desarrollo web full-stack',
  'Back-end and database work': 'Back-end y bases de datos',
  'APIs and integrations': 'APIs e integraciones',
  'Automated testing and TDD': 'Pruebas automatizadas y TDD'
} satisfies Record<string, string>;

export const spanishCvLanguages = {
  Spanish: { language: 'Español', proficiency: 'Lengua materna' },
  English: { language: 'Inglés', proficiency: 'Fluido, oral y escrito; uso profesional en equipos distribuidos.' }
} satisfies Record<string, LanguageTranslation>;

function translationFor<T>(translations: Record<string, T>, key: string): T {
  if (!Object.hasOwn(translations, key)) {
    throw new Error(`Missing Spanish CV translation for ${key}`);
  }
  return translations[key];
}

const { cv } = projection;

const spanishCv: Cv = {
  title: 'Desarrollador de software',
  profile: {
    heading: 'Perfil',
    text: 'Soy desarrollador de software, con unos quince años de experiencia profesional en sistemas web, de escritorio y móviles existentes, una base sólida en desarrollo back-end, bases de datos, APIs e integraciones, y amplia experiencia full-stack. Mi trabajo también incluyó pruebas automatizadas, cambios en datos y el seguimiento de cambios hasta producción cuando hacía falta. Desde fines de 2023, la enseñanza de Informática es mi actividad profesional principal, sin dejar de desarrollar software. Hoy construyo una actividad independiente como desarrollador junto con la docencia y tengo disponibilidad para trabajo remoto a tiempo parcial, por contrato o freelance.'
  },
  softwareExperience: {
    heading: 'Experiencia en software',
    roles: cv.softwareExperience.roles.map((role) => ({
      ...role,
      ...translationFor<RoleTranslation>(spanishCvRoles, role.organization)
    }))
  },
  currentDevelopment: {
    heading: 'Desarrollo actual',
    text: 'Mi trabajo actual de desarrollo abarca herramientas institucionales, software para la enseñanza y el aprendizaje, y herramientas para mi propio entorno de desarrollo.'
  },
  teaching: {
    heading: 'Enseñanza',
    text: 'Profesor de Informática en escuelas secundarias de Buenos Aires y responsable de la formación profesional en Informática del bachillerato del CFP N.º 7 desde 2023. Entre 2019 y 2020 di clases en la Tecnicatura Universitaria en Programación de la UNAHUR mientras trabajaba profesionalmente en software.'
  },
  education: {
    heading: 'Formación',
    items: cv.education.items.map((item) => ({
      ...item,
      ...translationFor<EducationTranslation>(spanishCvEducation, item.institution)
    }))
  },
  technicalBackground: {
    heading: 'Experiencia técnica',
    professionalExperience: {
      heading: 'Experiencia en desarrollo',
      items: cv.technicalBackground.professionalExperience.items.map((item) =>
        translationFor<string>(spanishCvDevelopmentExperience, item))
    },
    currentPractice: {
      heading: 'Tecnologías destacadas',
      items: cv.technicalBackground.currentPractice.items
    }
  },
  languages: {
    heading: 'Idiomas',
    items: cv.languages.items.map((item) =>
      translationFor<LanguageTranslation>(spanishCvLanguages, item.language))
  }
};

const cvs: Record<HomeLanguage, CvCopy> = {
  en: {
    language: 'en',
    path: LOCALIZED_PATHS.cv.en,
    shared: homeCopy('en').shared,
    cv,
    ui: {
      skip: homeCopy('en').ui.skip,
      language: homeCopy('en').ui.language,
      website: 'Website',
      technologies: 'Technologies:',
      pdfA4: 'A4 PDF',
      pdfLetter: 'US Letter PDF'
    }
  },
  es: {
    language: 'es',
    path: LOCALIZED_PATHS.cv.es,
    shared: homeCopy('es').shared,
    cv: spanishCv,
    ui: {
      skip: homeCopy('es').ui.skip,
      language: homeCopy('es').ui.language,
      website: 'Sitio web',
      technologies: 'Tecnologías:',
      pdfA4: 'PDF A4',
      pdfLetter: 'PDF Carta'
    }
  }
};

export function cvCopy(language: HomeLanguage): CvCopy {
  return cvs[language];
}
