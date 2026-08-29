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

We work with feature branches. A new feature is started from the develop branch. When the work is finished the branch is pushed to Github and a Merge Request is made. Do not override this convention.
All tests must pass before considering a task complete. 
If a test fails that was passing before your change, fix it before moving on.

Never:
- commit and push changes without the user confirmation
- Use `any` in TypeScript without a comment explaining why.
- Install a new package without confirming with me first.
