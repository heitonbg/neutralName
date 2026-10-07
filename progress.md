# Project progress

Updated: 2 October 2026

This is the current high-level overview of the **Вместе** web/Mini App project.
For the chronological record of implementation iterations, see
[`ARCHITECTURE_PROGRESS.md`](./ARCHITECTURE_PROGRESS.md).

## Current status

The client has been substantially reorganized around feature ownership,
resource APIs, MobX stores, URL-backed navigation, and component CSS Modules.
Mobile navigation and tablet/desktop sidebar layouts are present. The planned
visual design is being preserved while the remaining global CSS is migrated
incrementally. The project is not yet fully migrated or certified for
production configuration.

## Delivered

### Application structure and navigation

- The client is divided into `app`, `api`, `components`, `features`, `hooks`,
  `lib`, `pages`, `store`, `styles`, and `utils`.
- `App.jsx` is a composition layer; lifecycle behavior, screen state, and
  user actions are delegated to hooks and stores.
- Hash-based routes support static hosting, screen navigation, and URL-backed
  event/modal state. MAX BackButton and start parameters are integrated.
- On mobile, navigation uses the bottom bar. On tablet and desktop, the app
  uses a sidebar and a flexible content area; the wide layout has been checked
  at 768, 900, 1024, 1280, and 1600 px, in addition to a 390 px mobile width.

### API, authentication, and state

- An Axios client and resource-specific API modules centralize requests and
  MAX `initData` handling.
- The server validates signed MAX initialization data for protected
  operations; user identity for those operations comes from the validated
  session rather than an untrusted client-supplied ID.
- API resources cover users, events, friends, uploads, reports, geolocation,
  and tourist plans.
- `RootStore` combines session, UI, filters, events, friends, and tourist
  stores. Event data is normalized and asynchronous updates guard against
  stale responses; participation updates roll back on request errors.
- Local development supports a guest preview when MAX initialization data is
  unavailable. Guest mode does not bypass server-side authorization.

### Feature decomposition and styling

- Event creation, event details, the event map, friends, profile, and tourist
  planning are split into feature-owned components and hooks.
- Reusable UI lives in shared components; feature-specific styling is
  progressively moving to CSS Modules.
- Design tokens define the light/dark palette and now include semantic aliases
  plus shared spacing, radius, focus, and elevation scales.
- The current `src/App.css` is about 730 lines; shared utilities remain global
  while confirmed orphan and profile-specific rules have been removed.
- App shell responsive styles are scoped separately from component styles.
  Existing appearance is retained; token adoption is incremental.

### Quality checks

- ESLint enforces important import boundaries between application layers.
- Client and server test suites cover API behavior, utilities, state, and
  feature models.
- Lazy loading and route-level splitting keep the initial client bundle below
  the documented 150 KB gzip goal in the last recorded production build.
- After the current CSS changes, client ESLint, all 51 client tests, Prettier,
  and the production build passed. A 390 px browser smoke showed the mobile
  navigation and confirmed that opening Friends changes the route to
  `#/friends`.
- In that browser smoke, event data could not load because `VITE_API_URL` is
  not configured in the local environment; guest preview displayed the
  expected no-data state.

## Remaining work

### Required before production

1. Configure and verify production environment values, especially
   `VITE_API_URL`, MAX application settings, and server secrets outside source
   control.
2. Before release, run the client and server test suites, lint, formatting
   checks, and production builds against the final tree. Client lint, 51
   client tests, formatting, and production build passed in this iteration.
3. Verify real MAX authentication, direct-link/history navigation, and the
   protected API flows in the deployment environment; local guest preview
   cannot certify those integrations.
4. Perform a focused manual check of high-traffic flows and responsive views
   after the remaining CSS migration; the current browser check covered
   mobile navigation, not the full set of MAX-dependent flows.

### Incremental maintenance, not a release blocker by itself

- Finish migrating the remaining component-owned styles from `App.css` and
  `AppResponsive.module.css`.
- Review `ConsentScreen` and `OrganizerModal` ownership/usage before deciding
  whether to retain, further split, or remove them.
- Continue replacing literal colors and repeated spacing/radius values with
  semantic tokens as each component is touched.
- Expand test coverage for routing, URL-backed modal history, and integrated
  MAX behavior where an appropriate test environment is available.

## Documentation map

- [`tokens.md`](./tokens.md): current visual tokens and CSS ownership rules.
- [`ARCHITECTURE_PROGRESS.md`](./ARCHITECTURE_PROGRESS.md): detailed iteration
  log and architecture-plan history.
