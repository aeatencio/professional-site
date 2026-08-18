# Release roadmap and cumulative acceptance

## Foundation and projection work

Before visual R1 work depends on real content:

- reconcile the public consumer implementation and tests;
- receive only a deliberately exported and transferred
  `professional-public-projection/v1`;
- validate it locally with a self-contained build;
- keep the full private source and review state outside this repo.

Increment labels within R1.1 varied across older documents. Use deliverables,
not the letter suffix, to determine what remains.

## R1 · Complete static editorial experience

Outcome: a credible, navigable, responsive site that works with cable mode
`off`, plus an independent private-V1 Software Development CV.

Includes:

- semantic continuous document and navigation;
- deliberate English projection content for Home, Experience, Background, Working together
  and Contact;
- historical software roles, current development and teaching in one coherent
  experience chapter;
- visual tokens, typography, layout and layered-asset contract;
- responsive desktop/tablet/mobile composition;
- accessibility, focus, reduced-motion/static fallback;
- first reproducible Software Development CV in English, if its projection
  content and R1 scope are ready;
- base unit/browser/PDF checks justified by implemented behavior.

R1 does not close if the profile becomes unclear with the cable hidden, mobile
compresses the composition, essential content is absent, navigation/focus is
broken or professional copy does not come from the public projection.

## R2 · Deterministic cable interaction

Outcome: the complete page gains one restrained interactive continuity layer.

The following sequence is the current development plan, not an irreversible
specification. Each step should answer its visual and technical question before
the next one adds complexity.

### R2.1 · Static graphic system and hero

- Produce the production hero SVG in the approved hand-drawn editorial
  language.
- Preserve the complete scene: a contained person and laptop, small round
  café/bar table, visible chair, orange mug and generous negative space.
- Organize the SVG for later manipulation and integrate it statically into the
  existing hero.
- Preserve current Home copy, navigation, actions and composition rather than
  rebuilding the section around the asset.
- Check desktop and mobile without adding GSAP.

### R2.2 · Static journey objects

- Produce and integrate the notebook, folded map, folder with orange clip and
  Contact visual closure in the same graphic language.
- Evaluate the complete illustrated page before adding motion.

### R2.3 · Static cable route

- Build the independent `JourneyCable` route from laptop to notebook, folded
  map, folder and free end in Contact.
- Resolve geometry and occlusion against layout and viewport profiles before
  animation.
- Keep content, navigation and controls complete with the cable static, hidden
  or absent.

### R2.4 · Scroll interaction

- Add GSAP and ScrollTrigger only if they remain the best solution after the
  static route is proven.
- Progressively reveal the route and implement reversible S0–S3 hooks for
  downward and upward scroll.
- Add contained slack, inertia and damped settling, with an optional very small
  response to scroll velocity or direction.
- Preserve direct navigation, reload and history convergence; do not animate
  text or content by default.
- Keep the page understandable and usable if animation or JavaScript disappears.

### R2.5 · Refinement

- Review desktop, mobile, resize and orientation behavior.
- Verify performance, accessibility, `prefers-reduced-motion`, no-JavaScript
  and animation-disabled fallbacks.
- Refine visual state changes and focused tests for state, geometry and
  navigation.

R2 does not close if scroll history changes the final state, controls are
crossed/blocked, fast navigation queues animation, reduced motion loses
information or mobile reading width is sacrificed.

## R3 · Final CV and production release

Outcome: SITE-V1 and the existing private Software Development CV are finalized
and ready for immediate use.

Includes:

- final public copy and projection version;
- final one- or two-page A4 CV PDF generated from source;
- selectable/extractable text, correct reading order, links and metadata;
- stable CV route and all access points;
- accessibility, performance, SEO, metadata and asset optimization;
- browser/device matrix including a real mobile check;
- not-found/error checks, HTTPS/domain and deployment configuration;
- pipeline and release notes;
- final preview and explicit human publication decision.

R3 does not close if site/CV contradict, PDF is not reproducible or readable,
links/CTAs fail, private data appears, a credibility-damaging regression remains
or publication was not explicitly approved.

## Cross-release invariants

- Content works without animation.
- Every site commit remains public-safe.
- Build never reaches the private repo.
- Site and CV share canonical facts but own their copy.
- Later releases do not knowingly defer invisible debt that invalidates earlier
  acceptance.
- Publication, repository visibility and deployment remain separate human gates.
