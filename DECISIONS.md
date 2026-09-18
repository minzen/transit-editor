# Decision Log

This file records choices that future contributors should not have to rediscover. Add new decisions at the top of the log. Use one entry per decision and keep the alternatives and consequences honest.

Statuses: `proposed`, `accepted`, `superseded`, or `rejected`.

## DEC-002: Update label placement with station movement

- Date: 2026-09-18
- Status: accepted

### Decision

Support eight compass positions using the existing cardinal names plus `topRight`, `bottomRight`, `bottomLeft`, and `topLeft`. Existing maps keep their cardinal values and default to top when no position is stored.

Re-score labels near old/new station locations and changed route edges when moving stations, including pointer dragging, keyboard movement, and group translation. Keep distant stations unchanged and include label changes in the same history transaction as movement. The on-demand action still places labels across the whole map.

### Consequences

Manual label positions are not locked: movement can re-place labels in the affected neighborhood. Collision scoring remains a heuristic using approximate text bounds; it does not guarantee an overlap-free layout. Persisted and imported maps accept the new positions without changing the document version.

## DEC-001: Keep cross-computer project context in the repository

- Date: 2026-08-30
- Status: accepted

### Context

Work may continue on different computers or in separate coding-agent sessions. Chat history, local notes, uncommitted changes, editor state, and browser storage do not reliably follow the Git repository.

### Decision

Use three Markdown files at the repository root:

- `STATE.md` is the concise, frequently replaced handoff snapshot.
- `TODO.md` is the prioritized shared work queue.
- `DECISIONS.md` is the append-only record of durable choices and rationale.

`AGENTS.md` instructs contributors and coding agents to read and maintain these records. Context changes travel with related code changes through the normal feature-branch and pull-request workflow.

### Alternatives considered

- Rely only on chat history: convenient, but it is not guaranteed to be available on another machine or to every contributor.
- Use only issue tracking: useful for coordination, but too cumbersome for a concise repository handoff and may be unavailable offline.
- Use a single context file: simpler initially, but transient status tends to obscure durable decisions and backlog priority.

### Consequences

- Context becomes reviewable, searchable, and synchronized by Git.
- Contributors must spend a small amount of time keeping the files current.
- The files must never contain secrets or machine-specific information.
- Moving between computers still requires committing and pushing on one computer, then fetching or pulling on the other.

---

## New decision template

Copy this section above the existing decisions and assign the next number.

```markdown
## DEC-NNN: Short decision title

- Date: YYYY-MM-DD
- Status: proposed | accepted | superseded | rejected
- Supersedes: DEC-NNN (optional)

### Context

What problem or constraint required a decision?

### Decision

What was decided?

### Alternatives considered

What credible options were not selected, and why?

### Consequences

What becomes easier, harder, required, or intentionally unsupported?
```
