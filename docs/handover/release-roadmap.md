# Release roadmap and cumulative acceptance

## Foundation and projection work

Before visual R1 work depends on real content:

- reconcile the public consumer implementation and tests;
- receive only an explicitly approved `professional-public-projection/v1`;
- validate it locally with a self-contained build;
- keep the full private source and review state outside this repo.

Increment labels within R1.1 varied across older documents. Use deliverables,
not the letter suffix, to determine what remains.

## R1 · Complete static editorial experience

Outcome: a credible, navigable, responsive site and first functional CV source/
PDF path that still work with cable mode `off`.

Includes:

- semantic continuous document and navigation;
- approved English content for Home, Experience, Background, Working together
  and Contact;
- Surveda selected-work treatment;
- visual tokens, typography, layout and layered-asset contract;
- responsive desktop/tablet/mobile composition;
- cable origin/anchor markers without relying on motion;
- accessibility, focus, reduced-motion/static fallback;
- first reproducible Software Development CV in English, if the approved
  projection and R1 scope are ready;
- base unit/browser/PDF checks justified by implemented behavior.

R1 does not close if the profile becomes unclear with the cable hidden, mobile
compresses the composition, essential content is absent, navigation/focus is
broken or public data does not come from the approved projection.

## R2 · Deterministic cable interaction

Outcome: the complete page gains one restrained interactive continuity layer.

Includes:

- S0–S3 state resolver derived from scroll position and responsive profile;
- cable origin in laptop;
- notebook, map-fold and folder-clip anchors;
- reverse release on upward scroll;
- contained slack/inertia/settling;
- direct anchor navigation, reload, history and resize convergence;
- explicit interactive/static/off behavior;
- reduced motion and safe mobile simplification;
- layered SVG/DOM ownership and occlusion contract;
- focused unit and browser tests for state/geometry/navigation.

R2 does not close if scroll history changes the final state, controls are
crossed/blocked, fast navigation queues animation, reduced motion loses
information or mobile reading width is sacrificed.

## R3 · Final CV and production release

Outcome: SITE-V1 and the Software Development CV are ready for immediate use.

Includes:

- final public copy and approved projection version;
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
- Site and CV share approved facts but own their copy.
- Later releases do not knowingly defer invisible debt that invalidates earlier
  acceptance.
- Publication, repository visibility and deployment remain separate human gates.
