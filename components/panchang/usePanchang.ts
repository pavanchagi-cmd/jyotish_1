"use client";

import { useEffect, useState } from "react";

export interface PanchangJson {
  date: string;
  zone: string;
  sunrise: string | null;
  sunset: string | null;
  vara: { index: number; name: string };
  tithi: { index: number; name: string; paksha: string; endsAt: string | null };
  nakshatra: { index: number; name: string; pada: number; endsAt: string | null };
  yoga: { index: number; name: string; endsAt: string | null };
  karana: { index: number; name: string; endsAt: string | null };
  rahuKaal: { start: string; end: string } | null;
  abhijit: { start: string; end: string; avoidOnWednesday: boolean } | null;
  atSunrise: boolean;
}

export interface Place {
  lat: number;
  lng: number;
  label: string;
}

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: PanchangJson };

export function usePanchang(place: Place, date?: string): State {
  const key = `${place.lat},${place.lng},${date ?? ""}`;
  const [state, setState] = useState<{ key: string; value: State } | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const qs = new URLSearchParams({ lat: String(place.lat), lng: String(place.lng), ...(date ? { date } : {}) });
    fetch(`/api/panchang?${qs}`, { signal: ctrl.signal })
      .then(async (res) => {
        const body = await res.json();
        setState({
          key,
          value: res.ok ? { status: "ready", data: body.panchang } : { status: "error", message: body.error ?? "Could not load Panchang." },
        });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ key, value: { status: "error", message: "Could not load Panchang." } });
      });
    return () => ctrl.abort();
  }, [key, place.lat, place.lng, date]);

  return state && state.key === key ? state.value : { status: "loading" };
}

/**
 * Starts at the fallback place (birth place). "Use my location" asks for the
 * device location and labels it via reverse geocoding.
 */
export function useCurrentPlace(fallback: Place) {
  const [place, setPlace] = useState<Place>(fallback);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function locate() {
    if (!("geolocation" in navigator)) {
      setError("Location is not available on this device.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 1e4) / 1e4;
        const lng = Math.round(pos.coords.longitude * 1e4) / 1e4;
        let label = "Your location";
        try {
          const res = await fetch(`/api/places/reverse?lat=${lat}&lng=${lng}`);
          const body = (await res.json()) as { place?: { name: string } | null };
          if (body.place?.name) label = body.place.name;
        } catch {
          /* keep generic label */
        }
        setPlace({ lat, lng, label });
        setLocating(false);
      },
      () => {
        setError("Location permission was not given. Showing your birth place.");
        setLocating(false);
      },
      { timeout: 10_000, maximumAge: 30 * 60_000 },
    );
  }

  return { place, locate, locating, error, usingFallback: place === fallback };
}
