# Proposal 1 — Continuous surface with resting cable

**Status.** Historical design-process exploration. This document is no longer
normative and does not define the current product roadmap. The cable, its
chapter states, scroll activation, geometry and technical stack remain
hypotheses that may be revisited only through a new explicit product decision.
Compositional ideas that influenced the current site may survive independently
of the cable.

This specification covers visual composition, illustrations, cable path, scroll
activation and responsive behavior. It does not modify professional facts or
canonical copy.

Kept with the studio visual checkpoints in this folder. Current technical
boundaries live in [architecture](../../../architecture.md).

## Spatial fiction

> The Home is conceived as one very long, continuous visual surface. Illustrations
> and the cable belong to that same imaginary plane.

The cable:

- rests on that surface;
- does not hang vertically;
- does not need to obey screen-down gravity;
- has weight;
- has some rigidity;
- has some slack;
- can form broad, irregular curves;
- can wrap around objects;
- can pass behind them and reappear.

It is **not**:

- a timeline;
- an arrow;
- a conceptual diagram;
- a flow representation;
- an electrical connection between illustrations.

Illustrations function as:

- physical objects;
- compositional masses;
- landmarks;
- obstacles that condition the cable route.

## General compositional rule

> Text obeys a flexible grid and maintains reading discipline; illustrations and
> the cable are what disturb that grid.

The Home should admit:

- controlled spatial chaos;
- asymmetry;
- scale changes;
- displacement;
- spatial invasion;
- deliberate voids;
- different geometries between chapters.

Avoid:

- five equivalent rows;
- text always left + illustration always right;
- mechanical left/right alternation;
- chaotic collage;
- rotated or overlapping copy blocks;
- loss of legibility.

The grid exists, but objects do not always obey it.

## Global rhythm

Compositional progression:

**stability → displacement → rupture → compression → opening**

Mapped to chapters:

**Hero → Experience → Background → Working together → Contact**

Not every chapter needs the same degree of spatial complexity. Background is
deliberately the point of greatest spatial intensity.

## Hero — stability and origin

Keep a relatively stable composition.

Direction:

- text with primary gravity toward the left;
- person + laptop toward the right;
- enough air around both;
- laptop as the unambiguous cable origin.

The cable:

- originates physically at the laptop;
- begins with a broad, simple curve;
- still has limited gestural prominence.

**Cable role: born.**

## Experience — first displacement

This should be the first break from the current pattern.

Direction:

- title and introduction may keep a left-leaning base;
- larger notebook;
- notebook placed lower and closer to center;
- must invade part of the compositional space;
- must not act only as a side illustration;
- roles may use a wider geometry below;
- do not force all of Experience into a single left column.

The cable:

- deviates toward the notebook;
- partially wraps it;
- disappears briefly behind it;
- reappears below or to the side.

Occlusion should be perceptible but moderate.

**Cable role: deviates and hides briefly.**

## Background — main rupture

This is the chapter of greatest visual intensity.

Direction:

- map clearly larger than the other illustrations;
- occupy an important portion of center + left;
- allow diagonal, displacement or invasion of the previous axis;
- copy organized in disciplined blocks or islands;
- avoid reducing it to simple “map left / text right”;
- allow the highest degree of controlled chaos on the Home.

The cable:

- enters behind the map;
- stays hidden for a visually significant stretch;
- reappears clearly displaced;
- changes zone on the page.

It must not reappear immediately after the entry point. The map should feel
like an object that **really alters the route**.

**Cable role: disappears behind the map and reappears displaced.**

## Working together — compression

After Background, intensity should drop clearly.

Direction:

- relatively compact text;
- plenty of empty space;
- folder at moderate scale;
- geometry distinct from earlier chapters;
- no large new scene.

The cable should:

- reduce the amplitude of its curves;
- return to a more compact, contained trajectory;
- pass near or behind a corner of the folder;
- prepare a more open exit toward Contact.

A small slack zone or discreet loop is acceptable if it feels natural, but is
not required. Do not describe this behavior as “gathering,” which can read as
ambiguous.

**Cable role: becomes more compact.**

## Contact — opening and free end

Contact should feel like an opening after the previous compression.

Direction:

- clear contact text;
- plenty of air;
- displaced correspondence;
- avoid returning to a symmetric text/image composition.

The cable:

- regains some slack;
- makes one last curve;
- ends with a free extremity;
- does not connect or plug into the correspondence.

**Cable role: opens and ends free.**

## Distinct cable actions by chapter

| Chapter          | Cable behavior                                      |
| ---------------- | --------------------------------------------------- |
| Hero             | born                                                |
| Experience       | deviates and hides briefly                          |
| Background       | disappears behind the map and reappears displaced   |
| Working together | becomes more compact                                |
| Contact          | opens and ends free                                 |

The cable must not form one regular S-shape or repeat the same gesture five
times.

## Occlusion and depth

In future implementation:

- occlusion must use real layering;
- when the cable passes behind an object, it must be genuinely hidden;
- it must reappear afterward.

Do **not** use in production:

- dashed strokes;
- style changes to indicate depth;
- diagram graphic conventions.

Mockups may use those resources only to explain intent.

## Permanent geometry and scroll state

> Scroll does not redefine the page; it redefines the degree of activation of
> one continuous composition.

Two systems must remain separate.

### System A — permanent geometry

Does not depend on scroll:

- layout;
- base positions;
- structural scales;
- full cable route;
- layering;
- occlusions;
- spatial relationships.

The full composition must make sense even as a static state.

### System B — scroll activation

Depends on the exact scroll position:

- relative presence of chapters;
- opacity and/or contrast;
- emphasis of the local cable segment;
- persistence of what was just traversed;
- anticipation of what comes next;
- eventually small cable micro-settlements.

> The baseline cable geometry is fixed for a given responsive layout. Scroll
> continuously determines how that route is revealed, activated, emphasized or
> de-emphasized; it does not create a different structural route at each scroll
> position.

System B modulates System A; it does not replace it.

## Scroll perceptual model

Use three provisional conceptual states:

- **recent past**;
- **active present**;
- **hinted future**.

Transitions should be:

- continuous;
- smooth;
- not binary.

Do not close yet:

- opacity percentages;
- thresholds;
- formulas;
- activation coordinates;
- easing;
- timings.

Do not decide yet whether Experience or Background need internal substates.
The initial design unit is the full chapter.

## Future animation nature

The cable:

- must not permanently snake;
- does not behave like a hanging rope;
- animation is secondary to composition;
- the static state must work completely on its own.

The baseline structural trajectory remains fixed for a given responsive layout.
Scroll does not redefine that route. Future micro-animation may locally deform
the rendered cable around that baseline; such deformation must read as small
slack settlements on a surface and must not redefine the structural route.

`prefers-reduced-motion` must offer the full composition without depending on
movement.

Leave open:

- amplitude;
- duration;
- easing;
- number of animated zones;
- exact mapping from scroll position to activation values;
- possible initial perturbation.

## Responsive

Desktop first for defining spatial direction.

On mobile:

- greater stacking is expected;
- preserve the cable's visual identity;
- reduce lateral amplitude;
- simplify curves;
- simplify loops;
- reduce occlusions if needed;
- prioritize legibility.

Do not decide in advance to hide the cable on mobile. Consider that option only
if implementation shows real degradation.

## Closed decisions for the first prototype

- continuous visual surface;
- resting cable;
- physical continuity, not conceptual;
- stable structural trajectory;
- objects as landmarks/obstacles;
- controlled spatial chaos;
- disciplined text;
- Background as maximum rupture;
- distinct cable behavior per chapter;
- real occlusion;
- Working together with a more compact trajectory;
- Contact with opening and free end;
- scroll as activation of fixed geometry;
- minimal future animation;
- simplified mobile, not literal copy.

## Deliberately open decisions

Do not fix yet:

- exact coordinates;
- definitive SVG path;
- exact chapter heights;
- final illustration scale;
- breakpoints;
- opacity values;
- thresholds;
- easing;
- animation amplitudes;
- animation durations;
- chapter subdivision;
- concrete technical implementation of the cable.

Resolve these through prototype and visual review in the browser.

## Later implementation order

1. new spatial composition;
2. static cable;
3. real visual review on desktop/tablet/mobile;
4. composition and route corrections;
5. scroll activation;
6. subtle animation;
7. responsive and reduced-motion tuning.

None of these steps are implemented by this document.
