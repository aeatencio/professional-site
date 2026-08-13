# Architecture and R1 scope

SITE-V1 is a primarily static Astro site. Its main page will remain a continuous,
normally scrolling document whose content works independently of the future
decorative cable. HTML, CSS and TypeScript form the base; SVG will support later
graphic layers.

R1 establishes the repository and, in later increments, its factual content and
static presentation. R2 may add GSAP and ScrollTrigger only when interaction
requires them. R3 will consolidate production delivery and the reproducible CV.
Releases are cumulative: later work must preserve earlier guarantees.

Public Astro code consumes reviewed editorial projections, not the canonical
internal source or evidence catalog directly. Evidence metadata belongs outside
`src/`; pages, layouts, components and public projections must not import it.

The current increment intentionally contains no complete professional content,
visual system, cable, CV, browser automation, unit-test framework, UI framework,
backend, CMS, database, authentication, public AI or publishing infrastructure.
