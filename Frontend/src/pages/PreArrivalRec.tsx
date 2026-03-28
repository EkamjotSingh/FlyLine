import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  CheckSquare,
  Luggage,
  AlertTriangle,
  Navigation,
  Shield,
  Coffee,
  FileText,
  Utensils,
  ChevronRight,
  Plane,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { LucideIcon } from "lucide-react";
import RouteMap from "@/components/RouteMap";

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

type ChecklistEntry = {
  id: string;
  label: string;
  icon: LucideIcon;
  checked: boolean;
  required?: boolean;
};

const checklist: ChecklistEntry[] = [
  { id: "passport", label: "Passport / Government ID", icon: FileText, checked: false, required: true },
  { id: "boarding", label: "Boarding Pass (digital or printed)", icon: Plane, checked: false, required: true },
  { id: "luggage", label: "Checked luggage (under 50 lbs)", icon: Luggage, checked: false },
  { id: "carryon", label: "Carry-on bag packed", icon: Luggage, checked: false },
  { id: "liquids", label: "Liquids in quart-size bag", icon: Shield, checked: false },
  { id: "electronics", label: "Electronics easily accessible", icon: Shield, checked: false },
  { id: "snacks", label: "Snacks & water bottle (empty)", icon: Coffee, checked: false },
  { id: "food", label: "Grab a meal before the flight", icon: Utensils, checked: false },
  { id: "charger", label: "Phone charger & power bank", icon: Shield, checked: false },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const PreArrivalRec = () => {
  const [items, setItems] = useState(checklist);
  const [userCoords, setUserCoords] = useState<string | null>(null);
  const [driveMinutes, setDriveMinutes] = useState(flightData.driveMinutes);
  const [tsaWait, setTsaWait] = useState(flightData.tsaWaitMinutes);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => {},
    );
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const now = new Date();
      console.log(driveMinutes);
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flight_number: flightData.flightNumber.replace(/\s+/g, ""),
          airport_code: flightData.departure,
          departure_hour: 15,
          day_of_week: now.getDay(),
          month: now.getMonth() + 1,
          has_precheck: false,
          num_bags: 1,
          group_size: 1,
          distance_minutes: driveMinutes,
        }),
      });
      const data = await res.json();
      setTsaWait(data.predicted_wait_minutes);
      console.log("tsaWait set to", data.predicted_wait_minutes);
      setRecommendation(data.recommendation);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  };

  const completedCount = items.filter((i) => i.checked).length;
  const progress = Math.round((completedCount / items.length) * 100);

  const totalTimeNeeded =
    driveMinutes + tsaWait + flightData.baggageBoardingMinutes + 30;

  const airportLabel = `${flightData.departure} Airport`;

  const timingRows: {
    label: string;
    minutes: number;
    circleClass: string;
  }[] = [
    { label: "TSA", minutes: tsaWait, circleClass: "bg-primary text-primary-foreground" },
    {
      label: "Baggage Wait",
      minutes: flightData.baggageBoardingMinutes,
      circleClass: "bg-accent text-accent-foreground",
    },
    {
      label: "Total Estimated Time",
      minutes: totalTimeNeeded,
      circleClass: "bg-[hsl(262_83%_58%)] text-white",
    },
    { label: "Boarding Buffer", minutes: 30, circleClass: "bg-warning text-warning-foreground" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Brand banner — photo background */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl overflow-hidden relative min-h-[240px] sm:min-h-[300px] flex flex-col items-center justify-center py-10 px-6 text-center shadow-lg bg-muted"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/banner-flyline.jpg)" }}
          role="img"
          aria-label="Airplane in flight above the clouds"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, hsl(220 45% 12% / 0.45) 0%, hsl(220 40% 8% / 0.2) 45%, hsl(25 50% 12% / 0.35) 100%)",
          }}
        />
        <h1 className="relative z-10 font-display font-bold text-4xl sm:text-5xl text-white drop-shadow-md tracking-tight">
          FlyLine
        </h1>
        <p className="relative z-10 mt-2 text-lg sm:text-xl text-white font-medium drop-shadow-md max-w-md">
          From door to gate, never late.
        </p>
      </motion.div>

      {/* Your Flight — original dark blue gradient */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <div
          className="rounded-2xl p-6 text-primary-foreground shadow-lg"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm opacity-80 mb-1">Your Flight</p>
              <h2 className="text-2xl font-display font-bold">{flightData.flightNumber}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-lg font-semibold">{flightData.departure}</span>
                <ChevronRight className="h-4 w-4 opacity-60" />
                <span className="text-lg font-semibold">{flightData.arrival}</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm opacity-80">Departure</p>
              <p className="text-2xl font-bold">{flightData.departureTime}</p>
              <p className="text-sm opacity-80">Gate {flightData.gate}</p>
            </div>
          </div>
          {flightData.status === "delayed" && (
            <div className="mt-4 flex items-center gap-2 bg-warning/20 rounded-lg px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <span className="text-sm font-medium">
                Flight delayed by {flightData.delayMinutes} minutes
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
        {/* Route to Airport — full width */}
        <motion.div variants={item}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Navigation className="h-4 w-4 text-primary" />
                </div>
                Route to Airport
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-muted/60 border border-border/50 px-4 py-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Route</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      Your location → {airportLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:text-right shrink-0">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated drive</p>
                    <p className="text-xl font-bold text-foreground tabular-nums">{driveMinutes} min</p>
                  </div>
                </div>
              </div>
              {userCoords ? (
                <RouteMap
                  origin={userCoords}
                  destination={`${flightData.departure} Airport`}
                  originLabel="Your location"
                  destinationLabel={airportLabel}
                  onRouteLoaded={({ durationMinutes }) => setDriveMinutes(Math.round(durationMinutes / 60))}
                />
              ) : (
                <div className="rounded-xl bg-muted aspect-[21/9] min-h-[160px] flex items-center justify-center overflow-hidden relative border border-border/40">
                  <div
                    className="absolute inset-0 opacity-90"
                    style={{
                      background:
                        "linear-gradient(145deg, hsl(210 40% 92%) 0%, hsl(200 35% 88%) 40%, hsl(215 30% 85%) 100%)",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-accent/10" />
                  <div className="text-center z-10 px-4">
                    <Navigation className="h-8 w-8 text-primary mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-medium text-foreground">Live GPS Map</p>
                    <p className="text-xs text-muted-foreground mt-1">Turn-by-turn navigation preview</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* TSA & Timing — full width, circles */}
        <motion.div variants={item}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-accent" />
                </div>
                TSA & Timing Estimates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full rounded-xl bg-accent text-accent-foreground px-4 py-2.5 text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Predicting..." : "Get My TSA Prediction"}
                </button>
                {recommendation && (
                  <div className="mt-3 rounded-xl bg-accent/5 border border-accent/20 px-4 py-3">
                    <p className="text-sm text-foreground">{recommendation}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6 sm:gap-8">
                {timingRows.map((row) => (
                  <div key={row.label} className="flex flex-col items-center text-center gap-3">
                    <div
                      className={`h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20 rounded-full flex flex-col items-center justify-center shadow-md shrink-0 ${row.circleClass}`}
                    >
                      <span className="text-lg sm:text-xl font-bold tabular-nums leading-none">~{row.minutes}</span>
                      <span className="text-[10px] sm:text-xs font-medium opacity-90 mt-0.5">min</span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-foreground leading-snug px-1">{row.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Checklist */}
        <motion.div variants={item}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckSquare className="h-4 w-4 text-success" />
                  </div>
                  Pre-Flight Checklist
                </CardTitle>
                <Badge variant={progress === 100 ? "default" : "secondary"}>
                  {completedCount}/{items.length}
                </Badge>
              </div>
              <Progress value={progress} className="mt-3 h-2" />
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((checkItem) => (
                  <button
                    key={checkItem.id}
                    type="button"
                    onClick={() => toggleItem(checkItem.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all w-full ${
                      checkItem.checked
                        ? "bg-success/10 border border-success/20"
                        : "bg-muted hover:bg-muted/80 border border-transparent"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        checkItem.checked
                          ? "bg-success text-success-foreground"
                          : "border-2 border-muted-foreground/30"
                      }`}
                    >
                      {checkItem.checked && <Check className="h-3 w-3" />}
                    </div>
                    <span
                      className={`text-sm flex-1 min-w-0 ${
                        checkItem.checked ? "text-success line-through" : "text-foreground"
                      }`}
                    >
                      {checkItem.label}
                    </span>
                    {checkItem.required && (
                      <Badge
                        variant="destructive"
                        className="shrink-0 text-[10px] px-2 py-0 h-5 font-semibold pointer-events-none"
                      >
                        Required
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delay Recommendation */}
        {flightData.status === "delayed" && (
          <motion.div variants={item}>
            <Card className="glass-card border-warning/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  Delay Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/5 border border-warning/10">
                    <div className="h-6 w-6 rounded-full bg-warning/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-warning">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Stay home a bit longer</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your flight is delayed by {flightData.delayMinutes} minutes. You can leave{" "}
                        {flightData.delayMinutes} minutes later than originally planned.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Use the extra time wisely</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Double-check your checklist, grab a meal, or finish any last-minute packing. No need to rush!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/5 border border-accent/10">
                    <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-accent">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Monitor for updates</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Keep an eye on the flight status — delays can change. We&apos;ll notify you if anything updates.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PreArrivalRec;
