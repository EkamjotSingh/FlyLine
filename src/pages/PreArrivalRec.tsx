import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Clock, CheckSquare, Luggage, AlertTriangle,
  Navigation, Shield, Coffee, FileText, Utensils,
  ChevronRight, Plane, Timer, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

const checklist = [
  { id: "passport", label: "Passport / Government ID", icon: FileText, checked: false },
  { id: "boarding", label: "Boarding pass (digital or printed)", icon: Plane, checked: false },
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

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
  };

  const completedCount = items.filter((i) => i.checked).length;
  const progress = Math.round((completedCount / items.length) * 100);

  const totalTimeNeeded =
    flightData.driveMinutes + flightData.tsaWaitMinutes + flightData.baggageBoardingMinutes + 30; // 30 min buffer

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Flight Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="rounded-2xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm opacity-80 mb-1">Your Flight</p>
              <h1 className="text-2xl font-display font-bold">{flightData.flightNumber}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-lg font-semibold">{flightData.departure}</span>
                <ChevronRight className="h-4 w-4 opacity-60" />
                <span className="text-lg font-semibold">{flightData.arrival}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Departure</p>
              <p className="text-2xl font-bold">{flightData.departureTime}</p>
              <p className="text-sm opacity-80">Gate {flightData.gate}</p>
            </div>
          </div>
          {flightData.status === "delayed" && (
            <div className="mt-4 flex items-center gap-2 bg-warning/20 rounded-lg px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">
                Flight delayed by {flightData.delayMinutes} minutes
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-2">
        {/* GPS / Route */}
        <motion.div variants={item}>
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Navigation className="h-4 w-4 text-primary" />
                </div>
                Route to Airport
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-muted aspect-[16/9] flex items-center justify-center mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="text-center z-10">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Live GPS Map</p>
                  <p className="text-xs text-muted-foreground mt-1">Your location → JFK Airport</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Drive</p>
                  <p className="text-xl font-bold text-foreground">{flightData.driveMinutes} min</p>
                </div>
                <Badge variant="secondary" className="text-xs">Via I-495 E</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* TSA Wait & Timing */}
        <motion.div variants={item}>
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-accent" />
                </div>
                TSA & Timing Estimates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted p-4">
                  <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">TSA Wait</p>
                  <p className="text-lg font-bold text-foreground">~{flightData.tsaWaitMinutes} min</p>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <Luggage className="h-4 w-4 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Baggage Boarding</p>
                  <p className="text-lg font-bold text-foreground">~{flightData.baggageBoardingMinutes} min</p>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <Timer className="h-4 w-4 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Total Time Needed</p>
                  <p className="text-lg font-bold text-foreground">~{totalTimeNeeded} min</p>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Buffer</p>
                  <p className="text-lg font-bold text-foreground">30 min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Checklist */}
        <motion.div variants={item} className="md:col-span-2">
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
                    onClick={() => toggleItem(checkItem.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
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
                      className={`text-sm ${
                        checkItem.checked
                          ? "text-success line-through"
                          : "text-foreground"
                      }`}
                    >
                      {checkItem.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delay Recommendation */}
        {flightData.status === "delayed" && (
          <motion.div variants={item} className="md:col-span-2">
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
                        Your flight is delayed by {flightData.delayMinutes} minutes. You can leave {flightData.delayMinutes} minutes later than originally planned.
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
                        Keep an eye on the flight status — delays can change. We'll notify you if anything updates.
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
