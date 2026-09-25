import projection from '../data/professional-public-projection.v1.json' with { type: 'json' };
import { LOCALIZED_PATHS } from './site-identity.mjs';

export type HomeLanguage = 'en' | 'es';

const englishUi = {
  primary: 'Primary',
  menu: 'Menu',
  language: 'Language',
  skip: 'Skip to content',
  cv: 'CV',
  readCv: 'Read the CV',
  downloadPdf: 'Download PDF',
  downloadA4: 'Download the CV as an A4 PDF',
  downloadLetter: 'Download the CV as a US Letter PDF',
  letter: 'US Letter',
  footerCv: 'CV'
};

export interface HomeCopy {
  language: HomeLanguage;
  path: '/' | '/es/';
  shared: Omit<typeof projection.shared, 'language'> & { language: HomeLanguage };
  site: typeof projection.site;
  ui: typeof englishUi;
}

type TextItem = { heading: string; paragraphs: string[] };
type RoleTranslation = { role: string; description: string };

// The projection has no item IDs. Its organization names and English headings
// are the source keys: reordering is safe and unknown entries fail the build.
export const spanishRoles = {
  'Manas Technology Solutions': {
    role: 'Desarrollador de software',
    description: 'Trabajé en productos web y móviles para encuestas, salud y comunidades en línea, en equipos distribuidos que se comunicaban en inglés. Llegué a Manas con una experiencia más centrada en back-end y fui ampliando mi trabajo al resto del stack, con una participación importante en front-end durante los últimos años. En Surveda, donde trabajé varios años, las tareas solían partir de una necesidad del producto y no de una implementación ya definida: aclarar el alcance, investigar el código existente, definir una solución técnica, implementarla, probarla y acompañar algunos cambios hasta producción. El trabajo incluyó APIs, integraciones, cambios en bases de datos y migraciones. En Surveda trabajé con Elixir/Phoenix y React; en los distintos proyectos de Manas, el trabajo también incluyó JavaScript/TypeScript, Python, Node.js, Ruby on Rails, PostgreSQL y Flutter/Dart.'
  },
  'Mobile Streams': {
    role: 'Desarrollador de software',
    description: 'Trabajé en sistemas web y móviles de suscripción, distribución y descarga de contenido digital, con APIs, integraciones y aplicaciones respaldadas por bases de datos SQL. Las tecnologías incluían Android/Java, C#, ASP.NET, Angular y SQL Server.'
  },
  'RVM Soluciones': {
    role: 'Desarrollador de software',
    description: 'Desarrollé aplicaciones web y de escritorio, entre ellas sistemas de logística y distribución. Utilicé C#, ASP.NET, Visual Basic y SQL Server.'
  }
} satisfies Record<string, RoleTranslation>;

export const spanishCurrentItems = {
  'Institutional tools': {
    heading: 'Herramientas institucionales',
    paragraphs: ['Herramientas para necesidades institucionales, entre ellas un generador de boletines que desarrollé y sigo manteniendo para el CFP N.º 7.']
  },
  'Educational software': {
    heading: 'Software educativo',
    paragraphs: ['Proyectos web y de software para clases y formación técnica, que combinan el desarrollo con la enseñanza.']
  },
  'This site': {
    heading: 'Este sitio',
    paragraphs: ['Este sitio profesional es un proyecto estático con control de versiones, construido con Astro y TypeScript.']
  }
} satisfies Record<string, TextItem>;

export const spanishBackgroundItems = {
  'Academic foundation': {
    heading: 'Colegio Nacional de Buenos Aires',
    paragraphs: ['Estudié en el Colegio Nacional de Buenos Aires, un colegio preuniversitario de la Universidad de Buenos Aires. Su formación amplia y exigente sigue siendo una parte importante de mi base intelectual.']
  },
  'Systems': {
    heading: 'Formación en sistemas',
    paragraphs: ['Me gradué como Analista en Sistemas de Información en la Universidad del Salvador.']
  },
  'Across disciplines': {
    heading: 'Una formación amplia',
    paragraphs: ['Mi recorrido académico también incluyó varios años de estudios universitarios en la Universidad de Buenos Aires, principalmente en Veterinaria y luego en Letras, además de formación en el profesorado de Biología. Actualmente estoy completando la formación pedagógica en el IES Juan B. Justo, con 12 de las 15 materias del plan aprobadas.']
  }
} satisfies Record<string, TextItem>;

function translationFor<T>(translations: Record<string, T>, key: string): T {
  if (!Object.hasOwn(translations, key)) {
    throw new Error(`Missing Spanish Home translation for ${key}`);
  }
  return translations[key];
}

const professionalIdentity = 'Desarrollador de software · Profesor de Informática';
const { sections } = projection.site;

const spanishSite: HomeCopy['site'] = {
  title: `${projection.shared.name} — ${professionalIdentity}`,
  description: 'Desarrollador de software y profesor de Informática en Buenos Aires, con unos quince años de experiencia profesional en software y trabajo actual en educación tecnológica.',
  sections: {
    home: {
      paragraphs: [
        'Soy desarrollador de software y profesor de Informática en Buenos Aires. Durante unos quince años trabajé profesionalmente en software, sobre todo en productos web y móviles ya existentes. A fines de 2023, la enseñanza de Informática pasó a ser mi actividad profesional principal.',
        'Seguí desarrollando software en proyectos educativos, institucionales y personales. Hoy estoy construyendo mi propia actividad como desarrollador independiente, en paralelo con la docencia, y el desarrollo volvió a ocupar un lugar central en mi trabajo. Busco trabajo remoto a tiempo parcial, por contrato o como freelance, con una colaboración que pueda ser mayormente asincrónica.'
      ]
    },
    experience: {
      heading: 'Experiencia',
      paragraphs: [
        'Entre 2008 y 2023 trabajé de forma continua como desarrollador de software en sistemas web, de escritorio y móviles. Gran parte de mi experiencia se concentró en back-end, bases de datos, APIs e integraciones, y con el tiempo mi trabajo se volvió cada vez más full-stack.',
        'Trabajé principalmente sobre productos y sistemas existentes: desde logística y plataformas de contenido móvil hasta encuestas, salud y comunidades en línea. Mi trabajo incluía comprender cómo funcionaban, definir soluciones técnicas, implementar y probar cambios, trabajar con datos y migraciones, y acompañar los cambios en producción cuando era necesario.'
      ],
      softwareDevelopment: {
        heading: 'Desarrollo de software',
        roles: sections.experience.softwareDevelopment.roles.map((role) => ({
          ...role,
          ...translationFor<RoleTranslation>(spanishRoles, role.organization)
        }))
      },
      currentDevelopment: {
        heading: 'Desarrollo actual',
        paragraphs: ['Junto con la docencia, hoy desarrollo herramientas institucionales, software educativo y este sitio.'],
        items: sections.experience.currentDevelopment.items.map((item) =>
          translationFor<TextItem>(spanishCurrentItems, item.heading))
      },
      teaching: {
        heading: 'Enseñanza y formación tecnológica',
        paragraphs: [
          'Soy profesor de Informática en escuelas secundarias de la Ciudad de Buenos Aires y responsable de la formación profesional en Informática del bachillerato del CFP N.º 7.',
          'En el CFP N.º 7 coordino la formación profesional de la orientación en Informática y su articulación con la formación general del secundario. También doy clases de arquitectura de sistemas, interfaces web y proyectos finales.',
          'Diseño mis propios materiales y enseño a través de proyectos prácticos. A lo largo de los cuatro años de la orientación, los estudiantes pasan de la programación por bloques en entornos educativos a escribir código, construir y publicar interfaces web y, en el último año, trabajar por proyectos.',
          'Entre 2019 y 2020, mientras trabajaba profesionalmente en software, también di clases de introducción a la programación, persistencia e interfaces de usuario en la Tecnicatura Universitaria en Programación de la UNAHUR.'
        ]
      }
    },
    background: {
      heading: 'Formación',
      items: sections.background.items.map((item) =>
        translationFor<TextItem>(spanishBackgroundItems, item.heading))
    },
    cv: {
      heading: 'Currículum',
      paragraphs: ['Una versión breve de mi trayectoria, para leer en línea o descargar.']
    },
    workingTogether: {
      heading: 'Trabajemos juntos',
      paragraphs: [
        'Puedo hacerme cargo de un trabajo bien delimitado dentro de un producto existente, desde la investigación y la definición técnica hasta la implementación, las pruebas y la entrega. Puede tratarse de corregir errores, incorporar funcionalidades, integrar sistemas o realizar cambios en los datos.',
        'Tengo disponibilidad para trabajar de forma remota y a tiempo parcial, por contrato o como freelance, con una colaboración que pueda ser mayormente asincrónica.',
        'Podemos empezar con una llamada de 15 a 20 minutos, sin costo, para conversar y ver si podemos trabajar juntos. Para consultas puntuales que se puedan resolver en una conversación, también ofrezco sesiones pagas con cita previa. La investigación, la revisión de código, la reproducción de problemas, la implementación y los entregables escritos se acuerdan por separado, con un alcance definido.'
      ]
    },
    contact: {
      heading: 'Contacto',
      paragraphs: ['Si querés conversar sobre una oportunidad de trabajo en software, un proyecto o una consulta, escribime.']
    }
  }
};

const homes: Record<HomeLanguage, HomeCopy> = {
  en: {
    language: 'en',
    path: LOCALIZED_PATHS.home.en,
    shared: { ...projection.shared, language: 'en' },
    site: projection.site,
    ui: englishUi
  },
  es: {
    language: 'es',
    path: LOCALIZED_PATHS.home.es,
    shared: { ...projection.shared, language: 'es', professionalIdentity },
    site: spanishSite,
    ui: {
      primary: 'Principal',
      menu: 'Menú',
      language: 'Idioma',
      skip: 'Saltar al contenido',
      cv: 'CV',
      readCv: 'Ver el CV',
      downloadPdf: 'Descargar PDF',
      downloadA4: 'Descargar el CV en PDF A4',
      downloadLetter: 'Descargar el CV en PDF tamaño Carta',
      letter: 'Carta',
      footerCv: 'CV'
    }
  }
};

export function homeCopy(language: HomeLanguage): HomeCopy {
  return homes[language];
}
