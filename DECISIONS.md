# Decision Log

This file records choices that future contributors should not have to rediscover. Add new decisions at the top of the log. Use one entry per decision and keep the alternatives and consequences honest.

Statuses: `proposed`, `accepted`, `superseded`, or `rejected`.

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
