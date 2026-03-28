import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  FileText,
  Luggage,
  Navigation,
  Plane,
  Shield,
  Timer,
  Utensils,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import RouteMap from "@/components/RouteMap";

type LocationSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
};

const flightData = {
  flightNumber: "AA 1247",
  departure: "JFK",
  arrival: "LAX",
  departureTime: "3:45 PM",
  gate: "B22",
  status: "delayed" as const,
  delayMinutes: 35,
  tsaWaitMinutes: 22,
  driveMinutes: 38,
  baggageBoardingMinutes: 45,
};

const routePlan = {
  originQuery: "Times Square, Manhattan, New York, NY",
  destinationQuery: "John F. Kennedy International Airport, New York, NY",
};

const checklist = [
  { id: "passport", label: "Passport / government ID", detail: "Required", icon: FileText },
  { id: "boarding", label: "Boarding pass ready", detail: "Required", icon: Plane },
  { id: "carryon", label: "Carry-on packed", detail: "Required", icon: Luggage },
  { id: "liquids", label: "Liquids bag organized", detail: "TSA ready", icon: Shield },
  { id: "charger", label: "Phone charger packed", detail: "Recommended", icon: Shield },
  { id: "meal", label: "Meal or snack plan", detail: "Recommended", icon: Utensils },
  { id: "water", label: "Water bottle emptied", detail: "Checkpoint", icon: Coffee },
  { id: "buffer", label: "30-minute buffer kept", detail: "Required", icon: Timer },
];

function formatDuration(minutes: number | null) {
  if (minutes == null || Number.isNaN(minutes)) {
    return "--";
  }

  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function formatClockOffset(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

const PreArrivalRec = () => {
  const [items, setItems] = useState(
    checklist.map((item) => ({
      ...item,
      checked: item.id === "passport" || item.id === "boarding",
    })),
  );
  const [originInput, setOriginInput] = useState(routePlan.originQuery);
  const [destinationInput, setDestinationInput] = useState(routePlan.destinationQuery);
  const [activeOrigin, setActiveOrigin] = useState(routePlan.originQuery);
  const [activeDestination, setActiveDestination] = useState(routePlan.destinationQuery);
  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  const [originSearchError, setOriginSearchError] = useState<string | null>(null);
  const [destinationSearchError, setDestinationSearchError] = useState<string | null>(null);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [originTouched, setOriginTouched] = useState(false);
  const [destinationTouched, setDestinationTouched] = useState(false);
  const [liveDriveMinutes, setLiveDriveMinutes] = useState<number | null>(flightData.driveMinutes);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);
  const [firstInstruction, setFirstInstruction] = useState("");
  const skipOriginSearchRef = useRef(false);
  const skipDestinationSearchRef = useRef(false);

  const completedCount = items.filter((item) => item.checked).length;
  const totalTimeNeeded =
    (liveDriveMinutes ?? flightData.driveMinutes) +
    flightData.tsaWaitMinutes +
    flightData.baggageBoardingMinutes +
    30;

  useEffect(() => {
    const trimmedOrigin = originInput.trim();

    if (!originTouched) {
      return;
    }

    if (skipOriginSearchRef.current) {
      skipOriginSearchRef.current = false;
      return;
    }

    if (trimmedOrigin.length < 2) {
      setOriginSuggestions([]);
      setOriginSearchError(null);
      setIsSearchingOrigin(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingOrigin(true);
        setOriginSearchError(null);

        const response = await fetch(`/api/maps/search?q=${encodeURIComponent(trimmedOrigin)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Unable to search locations");
        }

        const payload = (await response.json()) as { results: LocationSuggestion[] };
        setOriginSuggestions(payload.results);
        setShowOriginDropdown(true);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setOriginSuggestions([]);
        setOriginSearchError(error instanceof Error ? error.message : "Unable to search locations");
        setShowOriginDropdown(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingOrigin(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [originInput, originTouched]);

  useEffect(() => {
    const trimmedDestination = destinationInput.trim();

    if (!destinationTouched) {
      return;
    }

    if (skipDestinationSearchRef.current) {
      skipDestinationSearchRef.current = false;
      return;
    }

    if (trimmedDestination.length < 2) {
      setDestinationSuggestions([]);
      setDestinationSearchError(null);
      setIsSearchingDestination(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingDestination(true);
        setDestinationSearchError(null);

        const response = await fetch(
          `/api/maps/search?q=${encodeURIComponent(trimmedDestination)}&kind=airport`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Unable to search airports");
        }

        const payload = (await response.json()) as { results: LocationSuggestion[] };
        setDestinationSuggestions(payload.results);
        setShowDestinationDropdown(true);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setDestinationSuggestions([]);
        setDestinationSearchError(error instanceof Error ? error.message : "Unable to search airports");
        setShowDestinationDropdown(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingDestination(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [destinationInput, destinationTouched]);

  const applyRoute = () => {
    const trimmedOrigin = originInput.trim();
    const trimmedDestination = destinationInput.trim();

    if (!trimmedOrigin || !trimmedDestination) {
      return;
    }

    setActiveOrigin(trimmedOrigin);
    setActiveDestination(trimmedDestination);
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setShowOriginDropdown(false);
    setShowDestinationDropdown(false);
  };

  const selectOriginSuggestion = (suggestion: LocationSuggestion) => {
    skipOriginSearchRef.current = true;
    setOriginInput(suggestion.label);
    setActiveOrigin(suggestion.label);
    setOriginSuggestions([]);
    setOriginSearchError(null);
    setShowOriginDropdown(false);
  };

  const selectDestinationSuggestion = (suggestion: LocationSuggestion) => {
    skipDestinationSearchRef.current = true;
    setDestinationInput(suggestion.label);
    setActiveDestination(suggestion.label);
    setDestinationSuggestions([]);
    setDestinationSearchError(null);
    setShowDestinationDropdown(false);
  };

  const toggleItem = (id: string) => {
    setItems((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, checked: !entry.checked } : entry)),
    );
  };

  const timingSteps = [
    {
      label: "Drive",
      value: formatDuration(liveDriveMinutes),
      caption: activeOrigin.split(",").slice(0, 2).join(","),
    },
    {
      label: "TSA",
      value: `~${flightData.tsaWaitMinutes} min`,
      caption: "Current checkpoint estimate",
    },
    {
      label: "Boarding",
      value: `~${flightData.baggageBoardingMinutes} min`,
      caption: "Bag drop + boarding window",
    },
    {
      label: "Leave by",
      value: formatDuration(totalTimeNeeded),
      caption: "Recommended total cushion",
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <motion.section
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] border border-sky-100 bg-[linear-gradient(135deg,#082f49_0%,#0f766e_38%,#f8fafc_100%)] p-6 text-white shadow-[0_30px_90px_rgba(8,47,73,0.22)] sm:p-8"
      >
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_58%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="space-y-5">
            <Badge className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white hover:bg-white/10">
              FlyLine Pre-Arrival
            </Badge>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-white/70">Live airport planning</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
                Leave at the right time, track the route, and arrive ready.
              </h1>
              <p className="mt-4 max-w-xl text-sm text-white/78 sm:text-base">
                FlyLine keeps your airport drive, TSA timing, and pre-flight checklist in one view so
                you can plan around delays instead of rushing into them.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-white/85">
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                Live route to {flightData.departure}
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                Search any US airport
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                Delay-aware timing
              </div>
            </div>
          </div>

          <Card className="border-white/18 bg-white/12 text-white shadow-none backdrop-blur-md">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-white/65">Current trip</p>
                  <h2 className="mt-2 text-2xl font-semibold">{flightData.flightNumber}</h2>
                </div>
                <Badge className="rounded-full bg-amber-300/20 px-3 py-1 text-amber-100 hover:bg-amber-300/20">
                  Delayed {flightData.delayMinutes} min
                </Badge>
              </div>

              <div className="rounded-3xl border border-white/12 bg-slate-950/18 p-4">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <Plane className="h-4 w-4" />
                  {flightData.departure}
                  <ChevronRight className="h-4 w-4 text-white/40" />
                  {flightData.arrival}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">Departure</p>
                    <p className="mt-1 text-lg font-semibold">{flightData.departureTime}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">Gate</p>
                    <p className="mt-1 text-lg font-semibold">{flightData.gate}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">Leave in</p>
                    <p className="mt-1 text-lg font-semibold">{formatClockOffset(totalTimeNeeded)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.75fr]"
      >
        <Card className="overflow-hidden border-border/60 bg-card shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Route planning</p>
                <h2 className="text-xl font-semibold text-foreground">Drive to the airport</h2>
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-border/60 bg-slate-50/80 p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <div className="relative">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Start location
                </p>
                <Input
                  value={originInput}
                  onChange={(event) => {
                    setOriginTouched(true);
                    setOriginInput(event.target.value);
                    setShowOriginDropdown(true);
                  }}
                  onFocus={() => {
                    setOriginTouched(true);
                    setShowOriginDropdown(true);
                  }}
                  onBlur={() => window.setTimeout(() => setShowOriginDropdown(false), 150)}
                  placeholder="Enter your address or landmark"
                  className="h-12 rounded-2xl border-border/70 bg-white"
                />
                {showOriginDropdown && (isSearchingOrigin || originSuggestions.length > 0 || originSearchError) && (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-border/60 bg-background shadow-lg">
                    {isSearchingOrigin && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">Searching locations...</div>
                    )}
                    {!isSearchingOrigin &&
                      originSuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.label}-${suggestion.latitude}-${suggestion.longitude}`}
                          type="button"
                          onClick={() => selectOriginSuggestion(suggestion)}
                          className="block w-full border-b border-border/40 px-3 py-2 text-left text-sm text-foreground transition-colors last:border-b-0 hover:bg-muted"
                        >
                          {suggestion.label}
                        </button>
                      ))}
                    {!isSearchingOrigin && !originSuggestions.length && originSearchError && (
                      <div className="px-3 py-2 text-xs text-destructive">{originSearchError}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Destination airport
                </p>
                <Input
                  value={destinationInput}
                  onChange={(event) => {
                    setDestinationTouched(true);
                    setDestinationInput(event.target.value);
                    setShowDestinationDropdown(true);
                  }}
                  onFocus={() => {
                    setDestinationTouched(true);
                    setShowDestinationDropdown(true);
                  }}
                  onBlur={() => window.setTimeout(() => setShowDestinationDropdown(false), 150)}
                  placeholder="Search any US airport"
                  className="h-12 rounded-2xl border-border/70 bg-white"
                />
                {showDestinationDropdown &&
                  (isSearchingDestination || destinationSuggestions.length > 0 || destinationSearchError) && (
                    <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-border/60 bg-background shadow-lg">
                      {isSearchingDestination && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">Searching airports...</div>
                      )}
                      {!isSearchingDestination &&
                        destinationSuggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.label}-${suggestion.latitude}-${suggestion.longitude}`}
                            type="button"
                            onClick={() => selectDestinationSuggestion(suggestion)}
                            className="block w-full border-b border-border/40 px-3 py-2 text-left text-sm text-foreground transition-colors last:border-b-0 hover:bg-muted"
                          >
                            {suggestion.label}
                          </button>
                        ))}
                      {!isSearchingDestination && !destinationSuggestions.length && destinationSearchError && (
                        <div className="px-3 py-2 text-xs text-destructive">{destinationSearchError}</div>
                      )}
                    </div>
                  )}
              </div>

              <Button type="button" onClick={applyRoute} className="h-12 rounded-2xl px-6">
                Update Route
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Search for a start address and choose any US airport destination. The live map and
              timing update from the latest route response.
            </p>

            <RouteMap
              origin={activeOrigin}
              destination={activeDestination}
              originLabel={activeOrigin}
              destinationLabel={activeDestination}
              onRouteLoaded={({ distanceMiles: nextDistanceMiles, durationMinutes, firstInstruction: nextInstruction }) => {
                setDistanceMiles(nextDistanceMiles);
                setLiveDriveMinutes(Math.round(durationMinutes));
                setFirstInstruction(nextInstruction || `Route ready to ${activeDestination}`);
              }}
            />

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
              <div className="rounded-[24px] border border-border/60 bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Start</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{activeOrigin}</p>
              </div>
              <div className="rounded-[24px] border border-border/60 bg-muted/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Destination</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{activeDestination}</p>
              </div>
              <div className="rounded-[24px] border border-primary/15 bg-primary/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live route</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {distanceMiles != null ? `${distanceMiles.toFixed(1)} mi` : "--"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {firstInstruction || "Route guidance appears here after the map loads."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden border-border/60 bg-card shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <Clock className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Timing overview</p>
                  <h2 className="text-xl font-semibold text-foreground">Know when to head out</h2>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                {timingSteps.map((step) => (
                  <div key={step.label} className="rounded-[28px] border border-border/60 bg-muted/40 p-4 text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-primary/15 bg-white shadow-sm">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{step.value}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {step.label}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{step.caption}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/60 bg-card shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Checklist</p>
                  <h2 className="text-xl font-semibold text-foreground">Pre-flight essentials</h2>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {completedCount}/{items.length}
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`flex w-full items-center gap-3 rounded-[22px] border p-3 text-left transition ${
                        item.checked
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-border/60 bg-muted/35 hover:bg-muted/55"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          item.checked ? "bg-emerald-500 text-white" : "bg-white text-muted-foreground"
                        }`}
                      >
                        {item.checked ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${item.checked ? "text-emerald-700 line-through" : "text-foreground"}`}>
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        {item.detail}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-8"
      >
        <Card className="overflow-hidden border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,1),rgba(255,247,237,1))] shadow-[0_20px_50px_rgba(245,158,11,0.10)]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/12">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-amber-700/80">Delay plan</p>
                    <h2 className="text-xl font-semibold text-slate-900">Use the delay without losing your buffer</h2>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Your flight is delayed by {flightData.delayMinutes} minutes, so you have extra room. The safest move
                  is still to leave based on the live drive plus TSA and boarding time, then keep an eye on any gate or
                  route changes.
                </p>
              </div>
              <div className="rounded-[24px] border border-amber-200 bg-white/85 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-700/70">Recommended departure window</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{formatClockOffset(totalTimeNeeded)}</p>
                <p className="mt-1 text-sm text-slate-500">from now, with a 30-minute buffer included</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/60 bg-white/85 p-4">
                <p className="text-sm font-semibold text-slate-900">Leave later, not last-minute</p>
                <p className="mt-2 text-sm text-slate-600">
                  The delay buys time, but use the refreshed route estimate before leaving so traffic does not erase it.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/60 bg-white/85 p-4">
                <p className="text-sm font-semibold text-slate-900">Finish the checklist now</p>
                <p className="mt-2 text-sm text-slate-600">
                  Use the extra window for ID, bags, chargers, and anything that would slow you down once you are out the door.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/60 bg-white/85 p-4">
                <p className="text-sm font-semibold text-slate-900">Watch live updates</p>
                <p className="mt-2 text-sm text-slate-600">
                  Route guidance updates with the selected start and airport so you can react if traffic or airport plans change.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
};

export default PreArrivalRec;
