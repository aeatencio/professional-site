# SITE-V1 design direction

## Status

The direction is consolidated enough to implement and refine. Do not restart a
broad style search. Exact typography, final asset production, detailed cable
physics and mobile geometry remain implementation/prototype decisions.

## Desired character

- editorial, mature, calm and human;
- technically credible without hacker aesthetics;
- personal without becoming intimate;
- cultured without solemnity;
- carefully made without luxury branding or marketing grandiosity.

## Visual system

- warm ivory base with a very subtle paper texture;
- cobalt blue as the structural color;
- orange used with extreme economy: a small physical detail and at most one
  competing functional accent in a composition;
- expressive large serif for editorial hierarchy;
- functional sans for body/interface text;
- open grid, controlled asymmetry and breathing room distributed throughout the
  page;
- blue line drawings of ordinary work objects and one contained human figure in
  the home;
- interior sections share materials and grammar but do not become identical
  templates.

Avoid dark developer themes, neon, fake terminals/code decoration, particles,
WebGL spectacle, 3D renders, skill bars, logo grids, rigid card systems and
generic portfolio templates.

## Reference use

Five full-resolution PNG composition checkpoints are stored only in the private
sibling repository because their pixels contain unapproved/superseded copy.
They may be inspected in an explicitly cross-repository design task, but must
not be copied into this Git history. They are composition checkpoints, not
pixel-perfect specifications. Preserve:

- strong header and identity;
- large black/cobalt editorial headlines;
- asymmetrical balance between text and illustration;
- deliberate negative space;
- blue structural lines and restrained orange;
- distinct section gestures within one family.

Do not preserve literal reference copy. Known later decisions differ:

- mockup wording remains non-authoritative even though the site is English;
- Manas public role is `Software Developer`, not Full-stack;
- availability is generic, not a precise weekly range;
- current-practice examples require factual review;
- Background's many crossing arrows must not compete with the global cable.

## Longitudinal architecture

The primary experience is one continuous page with ordinary, reversible browser
scroll. Sections are chapters, not fixed-height slides:

`Home → Experience → Background → Working together → Contact`

The CV remains accessible throughout but is not a stop in the narrative.

Content order, headings, navigation and links remain complete if the cable and
all illustration disappear. No scroll-jacking, forced scenes or delayed access
to content.

## Home

- `Andrés Atencio` is the header identity.
- The professional identity appears once as the H1, not repeated in an eyebrow
  or lower summary.
- Title, concise paragraph, actions and illustration form one composition.
- The human figure is contained and ordinary, working at a laptop.
- No footer closes the first viewport.
- The cable originates physically from the laptop and leaves the hero
  deliberately open toward the rest of the page.

## Experience

- This is the longest and densest chapter.
- Combine selected work, reverse professional chronology and current teaching/
  practice without treating each as a generic card.
- Surveda receives differentiated but contained treatment.
- Historical technology labels remain secondary to role, period and work.
- The first cable anchor is associated with the notebook/spiral object.

## Background

- Present completed qualifications, in-progress pedagogical training and partial
  multidisciplinary study honestly.
- The section should feel like paths meeting without implying that incomplete
  study is equivalent to a degree.
- Simplify the reference's dominant path diagram so it does not compete with the
  site-wide cable.
- The second cable anchor passes through a fold in a map/paper object.

## Working together

- Explain suitable collaboration using concrete work characteristics, not a
  sales funnel.
- Keep public availability generic and part-time/remote-friendly.
- A small, well-defined piece of existing-system work is a useful entry frame,
  if supported by approved copy.
- The third cable anchor passes beneath an orange folder clip.
- No public AI assistant or estimator belongs here in SITE-V1.

## Contact

- Resolve the editorial journey with a direct contact action, public links and
  CV access.
- The cable approaches/resolves near an ordinary contact object; it does not
  plug into an AI machine or become a metaphor that carries unique meaning.
- Contact remains fully functional in interactive, static and off modes.

## Cable behavior for R2

The cable is a deterministic presentation layer, not the page's state machine.
The same scroll position and responsive profile produce the same canonical
state, independent of scroll history or velocity.

| State | Settled anchors | Active region |
| --- | --- | --- |
| S0 | none | home/origin |
| S1 | notebook | Experience |
| S2 | notebook + map fold | Background |
| S3 | notebook + map fold + folder clip | Working together/contact approach |

Required qualities:

- three reversible anchors release in reverse order on upward scroll;
- visible slack, contained inertia and small damped settling;
- only the viewport-near segment needs to feel alive;
- navigation jumps resolve directly to the canonical destination state;
- resize/orientation changes converge immediately to the new profile;
- fast scroll never queues a long cinematic history;
- explicit modes: `interactive`, `static`, `off` (and a development debug mode
  if useful).

Do not use image-generation sequences to specify timing or geometry. Use a
controlled prototype and then implementation tests.

## Responsive and accessibility

- Desktop, tablet and mobile preserve semantic order and the same three
  conceptual anchors.
- Mobile recomposes vertically. It never reduces text width merely to keep the
  cable on screen.
- The cable may leave the viewport or be absent for long mobile stretches.
- Nothing important depends on hover.
- Header/menu, anchors and focus return are keyboard-operable.
- `prefers-reduced-motion` retains identical content, order and links with a
  static or off cable.
- Cable and illustrations are decorative for assistive technology unless they
  unexpectedly contain approved information, which should instead be moved to
  semantic text.

## Still open

- exact font families and loading strategy;
- final English line lengths after real projection content;
- Surveda screenshots/assets that add genuine understanding;
- exact CTA hierarchy and contact resolution;
- desktop/tablet/mobile cable geometry and whether mobile shows every segment;
- damping/amplitude values and browser-specific fallbacks;
- final footer composition.

Resolve each through the smallest prototype that answers that question.
