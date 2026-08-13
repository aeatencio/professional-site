# Professional source contract

The repository is the technical authority for professional information. Chats
may propose information, but they are not the final source of truth. References
and visual material must not be treated as factual content.

The canonical source separates four concerns:

1. **Professional facts** describe identity, experience, projects, teaching,
   education, technologies, links, contact, availability and privacy.
2. **Evidence references** support verification from an internal catalog outside
   `src/`, without placing private evidence or locators in the public build.
3. **Editorial selections** choose facts and copy independently for the site and
   CV. They share facts, not necessarily wording.
4. **Technical records** document changes and confirm that every factual update
   was reviewed against both projections.

Factual state, evidence and publication are independent dimensions. A confirmed
statement is not automatically publishable, whether or not evidence is linked.
Publication permission does not prove accuracy. Evidence presence is derived
from opaque evidence IDs associated with a fact, not from a factual state.

Publication history records each past appearance with its projection, release
and ISO 8601 calendar date (`YYYY-MM-DD`). It is historical state and does not
grant permission or determine current content. The current site and CV are
defined only by their independent editorial selections.

The public Astro code will consume reviewed editorial projections only. The
canonical internal source and evidence catalog will not be direct inputs to
pages, layouts or components. The evidence catalog, including private locators,
belongs outside `src/`; no evidence content is stored in this repository model.

The professional fact domains are `identity`, `experience`, `projects`,
`teaching`, `education`, `technologies`, `links`, `contact`, `availability` and
`privacy`. Evidence, editorial decisions and technical change records have
separate models and are not professional facts. R1.1 may refine and validate
this contract before loading complete professional data.
