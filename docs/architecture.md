# Architecture and R1 scope

SITE-V1 is a primarily static Astro site. Its main page will remain a continuous,
normally scrolling document whose content works independently of the future
decorative cable. HTML, CSS and TypeScript form the base; SVG will support later
graphic layers.

R1 establishes the repository and, in later increments, its approved public
content and static presentation. R2 may add GSAP and ScrollTrigger only when
interaction requires them. R3 will consolidate production delivery and the
reproducible CV. Releases are cumulative: later work must preserve earlier
guarantees.

The GitHub remote is currently private, while every commit and the entire history
are maintained as potentially public. Changing repository visibility and
deploying the site are independent actions, each requiring human authorization.

The private `professional-source` repository owns canonical facts, evidence
references, permissions, and internal decisions. This repository owns only the
implemented public representation. It will accept a versioned, sanitized,
validated, human-approved public projection and will not duplicate the complete
source.

Build, test, preview, and deploy are self-contained. They never read, clone,
mount, or query the private source. The site repository excludes private
evidence, internal locators, open questions, disputed or unapproved facts,
internal editorial notes, evidentiary documents, secrets, and unnecessary
personal data. A technical export is not publication authorization, and no
automation may change permissions or exposure without human approval.

Chats, copy, and visual references may propose information but cannot make it
canonical. Site and CV may use different wording for the same approved facts.
See the [public projection contract](public-projection-contract.md) and
[ADR 001](decisions/001-private-source-public-projection.md).

The current increment intentionally contains no complete professional content,
public projection schema, visual system, cable, CV, browser automation,
unit-test framework, UI framework, backend, CMS, database, authentication,
public AI, or publishing infrastructure.
