# Project State

Last updated: 2026-09-18
Verified implementation: eight-position label placement on `feature/eight-position-label-placement`, based on `5bfd75f`.
Base commit: `5bfd75f` on `develop`; snapping fix verified in the working tree

This is the short-lived handoff record for continuing work on another computer. Update it at the end of a work session and after pulling changes. Detailed feature documentation belongs in `README.md`; durable rationale belongs in `DECISIONS.md`.

## Current state

- The browser-based React/TypeScript transit map editor is functional and documented in `README.md`.
- The shared integration branch is `develop`; feature work starts from `develop` and is merged back through a pull request.
- Label improvements and roadmap cleanup start from `5bfd75f` on `develop`.
- Outstanding roadmap items are now tracked in `TODO.md`; completed roadmap history remains in Git.

## Active work

Mobile CI follow-up: the station-routing browser fixture now uses viewport-relative coordinates below the toolbar, waits for pointer actionability, and asserts exact coordinates after each drag step. All 30 editor interaction tests pass across desktop and mobile Chrome; type checking and lint also pass. Verified fix is ready for the user to push.

Follow-up fix on `feature/eight-position-label-placement` for station movement producing invalid line angles. Pointer/keyboard translation and direct station movement now share routing: simple connections reroute, custom routes adjust the adjoining bend, and freeform mode remains unconstrained. Angle validation now accepts only multiples of 45° with floating-point tolerance. Route and label updates remain in the movement history transaction.

Eight-position labels and roadmap cleanup are committed at `012c870`. The verified station-movement fix is ready for review on the same feature branch. The separate bend-dragging fix remains on `fix/line-angle-snapping` at `c9c4b38`; its bend-snapping geometry is reused here, but its canvas handler change remains on that branch.
- The snapping fix is on `fix/line-angle-snapping`, verified and ready for review against `develop`.

Bend dragging now uses adjacent polyline vertices and the nearest valid intersection or coincident-axis projection. Freeform dragging remains unconstrained. Regression coverage includes zoomed dragging and exact angle constraints across pointer positions.

## Verification

Verified on 2026-09-18 with Node.js 24:

- `npm test -- --maxWorkers=2`: 38 files, 412 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed (bundle-size advisory).
- `npm run e2e -- e2e/editor-interactions.spec.ts --project=chromium`: 13 passed.

## Blockers and handoff notes

- None currently recorded.
- Do not record local secrets or machine-specific paths here.

## End-of-session checklist

1. Update the active work, next step, blockers, and verification results above.
2. Reconcile item statuses in `TODO.md`.
3. Record any durable choice in `DECISIONS.md`.
4. Commit these files with the related work and push the branch after receiving user confirmation.

