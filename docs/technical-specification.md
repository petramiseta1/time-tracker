# Technical Specification

Productive Time Tracker is a client-side app for managing one person's time entries in [Productive](https://www.productive.io/). Sign in with a Productive API token and Organization ID, then view, add, edit, and delete time entries for a selected day. There is no backend — the browser talks to `api.productive.io` directly.

This document covers the architecture, the main UI components, how the app talks to the Productive API, and the decisions and trade-offs behind it.

---

## 1. Stack

| Choice                    | Why                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------- |
| **React 19 + TypeScript** | Component model fits the UI; types catch mistakes in the API mapping layer         |
| **Vite**                  | Fast dev server; builds to static files, which is all we can ship without a server |
| **React Router**          | The assignment requires edit to live at its own route                              |
| **TanStack Query**        | Handles caching, loading/error states, and refetching for all server data          |
| **SCSS Modules**          | Scoped styles, no utility-CSS framework to configure                               |

No UI kit, state-management library, or CSS framework beyond this — see [Decisions and trade-offs](#5-decisions-and-trade-offs). The only other dependencies are `date-fns` (dates) and `clsx` (class names).

---

## 2. Architecture

### Folder layout

Organised by technical layer, not by feature — simpler to scan at this size.

```
src/
  index.tsx              Entry point — mounts <App>
  App.tsx                Providers only (query client, toasts, auth, router)
  routers/               Route definitions and the two auth guards
  pages/                 LoginPage, DayEntriesPage (the day view)
  components/            All UI components
  context/               AuthContext (session), ToastContext (notifications)
  api/                   Request functions, response mapping, and query hooks
  utils/                 Date, duration, HTML, and initials helpers
  styles/                Global reset and design tokens
```

### Two kinds of state, kept apart

- **Data from the API** — time entries, the resolved membership, the default service. Owned entirely by TanStack Query, never copied into React state.
- **App-only data** — the auth session and the toast queue. Plain React Context; both are small and change rarely.

Everything else is local component state (form fields, "is this dialog open"). This split is why there is no global store: once API data lives in a query cache, what's left is small enough for Context.

### Routes

| Route                    | What it renders                                          |
| ------------------------ | -------------------------------------------------------- |
| `/login`                 | Login form. Redirects to `/` if already signed in.       |
| `/day/:date`             | Day view for `:date` (`YYYY-MM-DD`). Requires a session. |
| `/day/:date/entries/:id` | Edit dialog for one entry, on top of the day view.       |
| `/`                      | Redirects to today's day view.                           |

`RequireAuth` sends signed-out visitors to `/login`; `RedirectIfAuthed` keeps signed-in users off it.

The selected date lives **in the URL**, not in component state, so refreshing, bookmarking, or sharing a link all keep the right day. The edit route is nested inside the day route, so the day view stays mounted and renders the dialog through its `<Outlet />` — a real URL and working back button, without losing the list underneath.

---

## 3. Main UI components

### Pages

`LoginPage` — API token and Organization ID fields, plus submit. Errors show inline on the field that's wrong.

`DayEntriesPage` — the day view and the heart of the app: header, week strip, entry list, "Add entry" action, and the outlet for the edit dialog. Everything is derived from one week-long query — the day list and the week strip's totals both come from it.

### Time entry components

`WeekStrip` — seven day buttons with each day's total hours and a progress bar against an 8-hour target.

`DateNav` — previous/next arrows, a date button that opens a native `<input type="date">` picker, and a "Today" shortcut.

`EntryList` / `EntryListItem` — the day's entries, each showing duration, date, description, and Edit/Delete actions. Long descriptions clamp with a "Show more" toggle, shown only when the text actually overflows. A deleted row stays mounted briefly so it can animate out.

`EntryForm` — one component for both adding and editing. Three fields: date, duration, and a multiline description, plus quick-pick chips for 15m/30m/1h/2h.

`EntryEditOverlay` — what the `/day/:date/entries/:id` route renders: loads the entry and shows `EntryForm` in edit mode inside a `Modal`.

`EntryDeleteConfirm` — confirmation dialog before a delete, showing which entry will be removed.

### Shared building blocks

`Modal` — one dialog treatment for add, edit, and delete: portal, focus trap, closes on Escape or backdrop click, locks body scroll.

`Button`, `TextField`, `NumberInput`, `TextArea` — shared form and action primitives, so no screen hand-rolls its own input styling.

`Toast` / `ToastContext` — a hand-rolled notification queue. Every mutation reports its result here: success toasts auto-dismiss after 4 seconds, errors after 8.

`EmptyState`, `ErrorBanner`, `Avatar`, `LogoMark` — small supporting pieces. `ErrorBanner` carries the Retry action for a failed load.

### Styling and responsiveness

Colours, spacing, and shadows are CSS custom properties in `styles/css-variables.scss`. The layout is fluid, with one breakpoint (480px) that restructures the header, stacks entry rows, and makes toasts full-width. Hover styles are gated behind `@media (hover: hover)`, animations respect `prefers-reduced-motion`, and touch targets stay large enough to tap.

---

## 4. Talking to the Productive API

### The request layer

Every request goes through one function, `apiRequest` in `src/api/client.ts`. It prefixes the base URL (`https://api.productive.io/api/v2/`), sets the required headers, and turns non-2xx responses into an `ApiError` carrying the HTTP status — which lets the app tell a bad token (401) apart from other failures.

```
Content-Type: application/vnd.api+json
X-Auth-Token: <token>
X-Organization-Id: <organization id>
```

Productive is a JSON:API, so every response is wrapped in `data` / `attributes` / `relationships` / `included`. Each resource module unwraps that into a plain TypeScript type, so no component ever sees the JSON:API shape:

```ts
type TimeEntry = {
  id: string;
  date: string; // API: attributes.date, YYYY-MM-DD
  minutes: number; // API: attributes.time
  description: string; // API: attributes.note
};
```

### Signing in

1. `GET /organization_memberships?filter[organization_id]=<id>&include=person` — scoped to one membership instead of fetching all and searching client-side. `include=person` is required; without it, the response omits the person's id.
2. Read `personId` (and the person's name, for the avatar) off the result.
3. Save `{ token, organizationId, personId, personName }` to `localStorage` and into `AuthContext`.

On reload, the session loads from `localStorage` before the first render, so a refresh keeps you signed in. Logout clears both.

A 401 means the token is wrong; an empty result or a 403/404 means the Organization ID is wrong — two distinct messages, so the user knows which field to fix.

### Error handling

| Failure                        | What the user sees                                 |
| ------------------------------ | -------------------------------------------------- |
| Login rejected                 | Inline error on the token or organization field    |
| Loading a day fails            | Error banner with a Retry button                   |
| Create / update / delete fails | Error toast; the dialog stays open, ready to retry |
| Any request returns 401        | Session cleared, redirected to login               |

---

## 5. Decisions and trade-offs

**One week-long request instead of one per day.** Powers the week strip and the day list from a single response, and makes day-to-day navigation free. _Trade-off:_ slightly more data than a single day needs, and a mutation has to patch the correct week's cache by hand.

**Patching the cache instead of invalidating it.** Keeps saves feeling instant. _Trade-off:_ the patching logic, including moving an entry between weeks, is code we own and have to keep correct.

**SCSS Modules over a CSS framework.** Scoped, plain CSS with design tokens, no utility-class vocabulary or config to adopt. _Trade-off:_ more lines of CSS than a utility-class framework would need.

**Context over a state library.** Only two pieces of client-only global state exist — Zustand or Redux would be a dependency doing very little.

**Not everything is covered by tests.** Vitest covers the pure utility functions (`duration`, `date`, `html`, `initials` in `src/utils`) and one component (`WeekStrip`), run with `pnpm test`. Most of the 10-hour budget went to features, this specification, and UI polish, so the rest of the components, hooks, and the API mapping layer are still verified manually against each user story. _Trade-off:_ regressions in those areas aren't caught automatically. The natural next seam is the API mapping layer.

---

## 6. Assumptions

Where the assignment was ambiguous, these are the calls made.

**A** `service` **is required to create a time entry, so the app picks one silently.** `POST /time_entries` fails with a 422 error when `service` is omitted, even though the assignment says other `TimeEntry` relations are irrelevant. Since the required fields are only duration, date, and description, adding a service picker would contradict that — so `resolveDefaultServiceId` picks one automatically: a service the person already tracked time on, then one they're assigned to, then any service in the organization. (`task`, by contrast, really is optional.)

**A user has at most one membership per organization.** Login takes the first membership returned for the entered Organization ID; switching organizations means logging out and back in.

**The week runs Monday to Sunday**, and the daily target is 8 hours — neither specified by the assignment, both conventions from the design.

**Duration is entered in one flexible field.** The assignment just says "the amount of time worked (in minutes)"; a field accepting `1:30`, `1.5`, or `90m` is friendlier than raw minutes, and still sends minutes.
