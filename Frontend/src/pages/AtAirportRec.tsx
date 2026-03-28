import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Utensils,
  Coffee,
  Bed,
  Building2,
  MapPin,
  Armchair,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type AirportCode = "JFK" | "ATL";

const ATL_MAP_EMBED_URL = "https://www.atl.com/maps/";
const JFK_T4_TERMINAL_MAP_PAGE = "https://www.jfkt4.nyc/terminal-map/";

function buildJfkT4SearchUrl(search: string) {
  return `${JFK_T4_TERMINAL_MAP_PAGE}?search=${encodeURIComponent(search)}`;
}

const AIRPORT_LABEL: Record<AirportCode, string> = {
  JFK: "John F. Kennedy (JFK)",
  ATL: "Atlanta Hartsfield-Jackson (ATL)",
};

const flightInfo = {
  flightNumber: "AA 1247",
  departure: "JFK",
  arrival: "LAX",
  departureTime: "3:45 PM",
  gate: "B22",
  hoursUntilFlight: 3,
  isDelayed: true,
  delayHours: 3,
};

const reminders = [
  {
    timeLabel: "3 hours until departure",
    message:
      "Your flight is 3 hours late. Grab a meal at Shake Shack or Dunkin' because both appear in the official JFK Terminal 4 map.",
    type: "food" as const,
    icon: Utensils,
  },
  {
    timeLabel: "2+ hours until departure",
    message:
      "Your flight is still comfortably delayed. This is a good window to grab a snack or use the restroom before boarding changes.",
    type: "tip" as const,
    icon: Coffee,
  },
  {
    timeLabel: "Long delay detected",
    message:
      "Consider the Delta Sky Club or another lounge option nearby so you can settle in while the gate timing stabilizes.",
    type: "lounge" as const,
    icon: Armchair,
  },
];

type FoodOption = {
  id: string;
  airport: AirportCode;
  name: string;
  distance: string;
  location: string;
  rating: number;
  priceRange: string;
  tag: string;
  jfkT4Search?: string;
  verificationNote?: string;
};

const foodOptions: FoodOption[] = [
  {
    id: "jfk-shack",
    airport: "JFK",
    name: "Shake Shack",
    distance: "~4 min walk from Gate B22",
    location: "Terminal 4 - Gates B23 & B37",
    rating: 4.5,
    priceRange: "$$",
    tag: "Burgers",
    jfkT4Search: "Shake Shack",
    verificationNote: "Verified on official JFK Terminal 4 sources.",
  },
  {
    id: "jfk-dunkin",
    airport: "JFK",
    name: "Dunkin'",
    distance: "Arrivals Hall or near Gate B32",
    location: "Terminal 4 - Arrivals Hall and Concourse B",
    rating: 4.0,
    priceRange: "$",
    tag: "Coffee & donuts",
    jfkT4Search: "Dunkin",
    verificationNote: "Verified on official JFK Terminal 4 sources.",
  },
  {
    id: "atl-cfa",
    airport: "ATL",
    name: "Chick-fil-A",
    distance: "3 min walk",
    location: "Concourse A, Center",
    rating: 4.6,
    priceRange: "$$",
    tag: "Top Pick",
  },
  {
    id: "atl-one",
    airport: "ATL",
    name: "One Flew South",
    distance: "5 min walk",
    location: "Concourse E",
    rating: 4.7,
    priceRange: "$$$",
    tag: "Fine dining",
  },
  {
    id: "atl-varasano",
    airport: "ATL",
    name: "Varasano's Pizzeria",
    distance: "4 min walk",
    location: "Concourse D",
    rating: 4.4,
    priceRange: "$$",
    tag: "Pizza",
  },
  {
    id: "atl-papis",
    airport: "ATL",
    name: "Papi's Cuban & Caribbean Grill",
    distance: "6 min walk",
    location: "Concourse B",
    rating: 4.2,
    priceRange: "$$",
    tag: "Quick Bite",
  },
];

type ComfortSpot = {
  id: string;
  airport: AirportCode;
  type: string;
  name: string;
  location: string;
  distance: string;
  icon: LucideIcon;
  features: string[];
  jfkT4Search?: string;
};

const comfortSpots: ComfortSpot[] = [
  {
    id: "jfk-sky",
    airport: "JFK",
    type: "Lounge",
    name: "Delta Sky Club",
    location: "Terminal 4, Concourse B - between Gates B30 & B32",
    distance: "~6 min walk from Gate B22",
    icon: Armchair,
    features: ["Wi-Fi", "Food & bar", "Showers"],
    jfkT4Search: "Delta Sky Club",
  },
  {
    id: "jfk-capitalone",
    airport: "JFK",
    type: "Lounge",
    name: "Capital One Lounge",
    location: "Terminal 4",
    distance: "Inside Terminal 4",
    icon: Armchair,
    features: ["Lounge", "Food", "Seating"],
    jfkT4Search: "Capital One Lounge",
  },
  {
    id: "jfk-chase",
    airport: "JFK",
    type: "Lounge",
    name: "Chase Sapphire Lounge",
    location: "Terminal 4",
    distance: "Inside Terminal 4",
    icon: Armchair,
    features: ["Lounge", "Dining", "Seating"],
    jfkT4Search: "Chase Sapphire Lounge",
  },
  {
    id: "jfk-hello",
    airport: "JFK",
    type: "Lounge",
    name: "HelloSky Lounge",
    location: "Terminal 4",
    distance: "Inside Terminal 4",
    icon: Bed,
    features: ["Quiet seating", "Rest", "Refresh"],
    jfkT4Search: "HelloSky Lounge",
  },
  {
    id: "atl-sky-e",
    airport: "ATL",
    type: "Lounge",
    name: "Delta Sky Club",
    location: "Concourse E",
    distance: "4 min walk",
    icon: Armchair,
    features: ["Wi-Fi", "Bar", "Showers"],
  },
  {
    id: "atl-minute",
    airport: "ATL",
    type: "Rest Area",
    name: "Minute Suites",
    location: "Concourse B",
    distance: "5 min walk",
    icon: Bed,
    features: ["Private suites", "Nap", "Work desk"],
  },
  {
    id: "atl-westin",
    airport: "ATL",
    type: "Hotel",
    name: "The Westin Atlanta Airport",
    location: "Connected to terminal",
    distance: "10 min walk / shuttle",
    icon: Building2,
    features: ["Day rooms", "Fitness", "Dining"],
  },
];

function resolveEmbedMapUrl(
  airport: AirportCode,
  selectedFood: FoodOption | undefined,
  selectedComfort: ComfortSpot | undefined,
) {
  if (airport === "ATL") return ATL_MAP_EMBED_URL;
  const search = selectedFood?.jfkT4Search ?? selectedComfort?.jfkT4Search;
  return search ? buildJfkT4SearchUrl(search) : JFK_T4_TERMINAL_MAP_PAGE;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const typeColors = {
  food: "bg-warning/10 border-warning/20 text-warning",
  tip: "bg-primary/10 border-primary/20 text-primary",
  lounge: "bg-accent/10 border-accent/20 text-accent",
};

type Selection =
  | { kind: "food"; id: string }
  | { kind: "comfort"; id: string }
  | null;

type WaitReport = {
  source: "timed";
  minutes: number;
  label: string;
  details: string;
  submittedAt: string;
};

const AtAirportRec = () => {
  const [airport, setAirport] = useState<AirportCode>(flightInfo.departure === "ATL" ? "ATL" : "JFK");
  const [selection, setSelection] = useState<Selection>(null);
  const [tsaHours, setTsaHours] = useState("0");
  const [tsaMinutes, setTsaMinutes] = useState("20");
  const [latestWaitReport, setLatestWaitReport] = useState<WaitReport | null>(null);

  const foodsHere = useMemo(() => foodOptions.filter((food) => food.airport === airport), [airport]);
  const comfortHere = useMemo(() => comfortSpots.filter((spot) => spot.airport === airport), [airport]);

  const selectedFood = selection?.kind === "food" ? foodsHere.find((food) => food.id === selection.id) : undefined;
  const selectedComfort = selection?.kind === "comfort"
    ? comfortHere.find((spot) => spot.id === selection.id)
    : undefined;

  const mapEmbedUrl = useMemo(
    () => resolveEmbedMapUrl(airport, selectedFood, selectedComfort),
    [airport, selectedComfort, selectedFood],
  );

  const reportedTsaMinutes = useMemo(() => {
    const hours = Number(tsaHours);
    const minutes = Number(tsaMinutes);

    if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 0 || minutes < 0 || minutes > 59) {
      return null;
    }

    return hours * 60 + minutes;
  }, [tsaHours, tsaMinutes]);

  const saveTimedReport = () => {
    if (reportedTsaMinutes === null || reportedTsaMinutes <= 0) return;

    setLatestWaitReport({
      source: "timed",
      minutes: reportedTsaMinutes,
      label: "Traveler-reported TSA wait",
      details: `${tsaHours} hr ${tsaMinutes} min`,
      submittedAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="rounded-2xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 text-sm opacity-80">You&apos;re at the Airport</p>
              <h1 className="text-2xl font-display font-bold">{flightInfo.flightNumber}</h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-lg font-semibold">{flightInfo.departure}</span>
                <ChevronRight className="h-4 w-4 opacity-60" />
                <span className="text-lg font-semibold">{flightInfo.arrival}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Time Until Boarding</p>
              <p className="text-2xl font-bold">{flightInfo.hoursUntilFlight}h 00m</p>
              <p className="text-sm opacity-80">Gate {flightInfo.gate}</p>
            </div>
          </div>
          {flightInfo.isDelayed && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning/20 px-4 py-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">
                Flight delayed by {flightInfo.delayHours} hours - see recommendations below
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="mb-8"
      >
        <Card className="glass-card overflow-hidden">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                Airport Map & Nearby Places
              </CardTitle>
              <Tabs
                value={airport}
                onValueChange={(value) => {
                  setAirport(value as AirportCode);
                  setSelection(null);
                }}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
                  <TabsTrigger value="JFK" className="text-xs sm:text-sm">JFK</TabsTrigger>
                  <TabsTrigger value="ATL" className="text-xs sm:text-sm">ATL</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <p className="text-xs text-muted-foreground">
              {airport === "JFK"
                ? "JFK uses the official Terminal 4 panel. Tap a food or rest spot to search that exact place in the real T4 map."
                : `${AIRPORT_LABEL[airport]} - tap a place for details.`}{" "}
              If the map does not load here, use Open full map.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30">
              <iframe
                key={mapEmbedUrl}
                title={`${AIRPORT_LABEL[airport]} interactive map`}
                src={mapEmbedUrl}
                className="h-[40vh] min-h-[280px] max-h-[520px] w-full bg-background"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t border-border/50 bg-muted/40 px-3 py-2">
                {airport === "JFK" && (
                  <a
                    href={JFK_T4_TERMINAL_MAP_PAGE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-auto inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                  >
                    Terminal 4 map home
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <a
                  href={mapEmbedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Open full map
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Utensils className="h-4 w-4 text-warning" />
                  Nearby Food Options
                </h3>
                <div className="grid gap-2">
                  {foodsHere.map((food) => {
                    const isSelected = selection?.kind === "food" && selection.id === food.id;
                    return (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => setSelection({ kind: "food", id: food.id })}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                          isSelected
                            ? "border-warning/40 bg-warning/10 ring-2 ring-warning/20"
                            : "border-transparent bg-muted/80 hover:border-border/60 hover:bg-muted",
                        )}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                          <Utensils className="h-4 w-4 text-warning" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{food.name}</span>
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{food.tag}</Badge>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{food.location}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {food.distance} · {food.rating} star · {food.priceRange}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Bed className="h-4 w-4 text-accent" />
                  Comfort & Rest Nearby
                </h3>
                <div className="grid gap-2">
                  {comfortHere.map((spot) => {
                    const Icon = spot.icon;
                    const isSelected = selection?.kind === "comfort" && selection.id === spot.id;
                    return (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => setSelection({ kind: "comfort", id: spot.id })}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                          isSelected
                            ? "border-accent/40 bg-accent/10 ring-2 ring-accent/20"
                            : "border-transparent bg-muted/80 hover:border-border/60 hover:bg-muted",
                        )}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                          <Icon className="h-4 w-4 text-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{spot.name}</span>
                            <Badge variant="secondary" className="text-[10px]">{spot.type}</Badge>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{spot.location}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">{spot.distance}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {spot.features.map((feature) => (
                              <span
                                key={feature}
                                className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {(selectedFood || selectedComfort) && (
              <div className="animate-in fade-in-50 rounded-xl border border-border/60 bg-card p-4 duration-200">
                {selectedFood && (
                  <>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected - Food</p>
                    <h4 className="text-lg font-display font-bold text-foreground">{selectedFood.name}</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{selectedFood.tag}</Badge>
                      <Badge variant="outline">{selectedFood.priceRange}</Badge>
                      <Badge variant="outline">{selectedFood.rating} star</Badge>
                      {selectedFood.verificationNote && <Badge variant="outline">Official T4</Badge>}
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{selectedFood.location}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Walk time:</span> {selectedFood.distance}
                    </p>
                  </>
                )}
                {selectedComfort && (
                  <>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Selected - {selectedComfort.type}
                    </p>
                    <h4 className="text-lg font-display font-bold text-foreground">{selectedComfort.name}</h4>
                    <Badge variant="secondary" className="mt-2">{selectedComfort.type}</Badge>
                    <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{selectedComfort.location}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Walk time:</span> {selectedComfort.distance}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {selectedComfort.features.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} initial="hidden" animate="show" className="mb-8">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              TSA Waitline Check-In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Share back to travelers at home
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {latestWaitReport ? `~${latestWaitReport.minutes} min` : "No live TSA wait shared yet"}
                  </p>
                  {latestWaitReport && (
                    <p className="text-xs text-muted-foreground">
                      {latestWaitReport.details} · Updated {latestWaitReport.submittedAt}
                    </p>
                  )}
                </div>
                <Badge variant="default">Traveler reported</Badge>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Hours</span>
                  <input
                    type="number"
                    min="0"
                    value={tsaHours}
                    onChange={(event) => setTsaHours(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Minutes</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={tsaMinutes}
                    onChange={(event) => setTsaMinutes(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={saveTimedReport}
                disabled={reportedTsaMinutes === null || reportedTsaMinutes <= 0}
                className={cn(
                  "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition",
                  reportedTsaMinutes === null || reportedTsaMinutes <= 0
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-accent text-accent-foreground hover:opacity-90",
                )}
              >
                Share actual TSA wait
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-2">
        <motion.div variants={item} className="md:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                Smart Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reminders.map((reminder, index) => {
                const Icon = reminder.icon;
                return (
                  <div key={index} className={`flex items-start gap-3 rounded-xl border p-4 ${typeColors[reminder.type]}`}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium opacity-70">{reminder.timeLabel}</p>
                      <p className="text-sm font-medium text-foreground">{reminder.message}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AtAirportRec;
