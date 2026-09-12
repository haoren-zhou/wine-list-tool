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

The frontend expects a list of wines with `enrichment_status` set to `matched`, `unmatched`, or `lookup_failed`. Deploy it with the matching backend. Rows show original menu names; expanded details show the Vivino match and name similarity. Results start with search and filters; each wine shows its rating or missing-rating status. Initial filters include unrated wines; a positive minimum rating excludes them. Rating sorts keep unavailable ratings last.

### UI

Colors, spacing, and responsive layouts live in `src/styles/index.css`. Newsreader is self-hosted through `@fontsource-variable/newsreader`; its SIL OFL license ships at `/licenses/newsreader.txt`. Body text uses the system sans-serif font.

Search matches original and Vivino names without requiring accents. Mobile filters expand inline and return focus to the toggle when closed. Budgets use whole-dollar amounts or no limit; fractional input displays rounded to the nearest dollar on blur or Enter. Wine prices retain cents. Active filter chips can be removed individually. The upload screen shows the filename during processing and errors, but not in results; it does not simulate progress percentages.
