import type { Location } from "react-router-dom";

// Shared shape for the `backgroundLocation` state AppRoutes, EntryDeepLink,
// and EntryEditOverlay all read or write (ADR 0004) — a single place for the
// cast so the three don't drift on how it's stored.
export type BackgroundLocationState = { backgroundLocation?: string } | null;

export function getBackgroundLocation(location: Location): string | undefined {
  return (location.state as BackgroundLocationState)?.backgroundLocation;
}
