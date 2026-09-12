## Frontend

This directory contains the React application.

### Structure

- `src/pages`: Main page components (`App.tsx`, `FormPage.tsx`, `FilterableWineList.tsx`).
- `src/components`: Reusable React components.
- `src/contexts`: React context for managing application state.
- `src/hooks`: Custom React hooks.
- `src/services`: API communication logic.
- `src/styles`: CSS files.
- `src/utils`: Utility functions and constants.
- `src/test`: Shared fixtures and setup for Vitest and React Testing Library.

### Checks

Run `npm ci`, then `npm test`, `npm run lint`, and `npm run build`. Tests cover file selection/drop validation, upload/reset states, partial results, filtering, pagination, and accordion accessibility without live API calls.

### Upload response

The frontend expects a list of wines with `enrichment_status` set to `matched`, `unmatched`, or `lookup_failed`. Deploy it with the matching backend. The UI preserves unmatched/failed entries, uses original names when no rated match is available, and displays counts and partial-result warnings. Initial filters include unrated wines; a positive minimum rating excludes them.
