This is a browser-based reactive editor for sketching and editing schematic 
transit maps. 

The technology stack is:
- React
- TypeScript
- Vite
- Zustand
- React Router
- Material UI (MUI)
- i18next
- Zod
- SVG rendering
- World coordinates
- Viewport management
- Octolinear snapping
- Component separation
- Input validation
- Vitest
- React Testing Library
- Playwright
- ESLint
- Docker
- Nginx

We work with feature branches. A new feature is started from the develop branch. When the work is finished the branch is pushed to Github and a Merge Request to develop is made. Do not override this convention. We merge regularly from develop to main.
All tests must pass before considering a task complete. 
If a test fails that was passing before your change, fix it before moving on.

## Shared project context

At the start of a work session, read these version-controlled files:

- `STATE.md` for the current handoff and verification status.
- `TODO.md` for active and upcoming work.
- `DECISIONS.md` for durable technical and product decisions.

Keep them useful across computers and contributors:

- Update `STATE.md` when the working focus, blockers, or last verified commit changes.
- Update `TODO.md` when work is added, started, completed, or deliberately dropped.
- Append to `DECISIONS.md` when a decision will constrain future work; do not rewrite old decisions silently. Mark a superseded decision and link to its replacement.
- Never put secrets, credentials, personal data, or machine-specific absolute paths in these files.
- Commit and push context-file changes with the related code, subject to the confirmation rule below. Uncommitted files do not transfer between computers.

Never:
- commit and push changes without the user confirmation
- Use `any` in TypeScript without a comment explaining why.
- Install a new package without confirming with me first.
