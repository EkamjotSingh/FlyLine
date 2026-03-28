import { motion } from "framer-motion";
import {
  Clock, Utensils, Coffee, Bed, Building2, MapPin,
  Armchair, AlertCircle, Plane, ChevronRight, Wifi
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      "Your flight is 3 hours late. You should grab some Chick-fil-A before your flight! 🍗",
    type: "food" as const,
    icon: Utensils,
  },
  {
    timeLabel: "2+ hours until departure",
    message:
      "Your flight is 2 hours away from arrival. I suggest you grab a snack or use the restroom before your flight's arrival!",
    type: "tip" as const,
    icon: Coffee,
  },
  {
    timeLabel: "Long delay detected",
    message:
      "Consider visiting the Delta Sky Club lounge near Gate B18 — relax with complimentary snacks and Wi-Fi.",
    type: "lounge" as const,
    icon: Armchair,
  },
];

const foodOptions = [
  {
    name: "Chick-fil-A",
    distance: "2 min walk",
    location: "Terminal 4, Food Court",
    rating: 4.5,
    priceRange: "$$",
    tag: "Top Pick",
  },
  {
    name: "Shake Shack",
    distance: "4 min walk",
    location: "Terminal 4, Gate B12",
    rating: 4.3,
    priceRange: "$$",
    tag: "Burgers",
  },
  {
    name: "Starbucks",
    distance: "1 min walk",
    location: "Terminal 4, Gate B20",
    rating: 4.0,
    priceRange: "$",
    tag: "Coffee",
  },
  {
    name: "Panda Express",
    distance: "5 min walk",
    location: "Terminal 4, Food Court",
    rating: 3.8,
    priceRange: "$",
    tag: "Quick Bite",
  },
];

const comfortSpots = [
  {
    type: "Lounge",
    name: "Delta Sky Club",
    location: "Gate B18",
    distance: "3 min walk",
    icon: Armchair,
    features: ["Wi-Fi", "Snacks", "Showers"],
  },
  {
    type: "Rest Area",
    name: "Minute Suites",
    location: "Terminal 4, Level 3",
    distance: "6 min walk",
    icon: Bed,
    features: ["Private rooms", "Nap pods", "Quiet zone"],
  },
  {
    type: "Hotel",
    name: "TWA Hotel",
    location: "On-site JFK",
    distance: "8 min walk",
    icon: Building2,
    features: ["Day rooms", "Pool", "Restaurant"],
  },
];

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

const AtAirportRec = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Flight Status Bar */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="rounded-2xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm opacity-80 mb-1">You're at the Airport</p>
              <h1 className="text-2xl font-display font-bold">{flightInfo.flightNumber}</h1>
              <div className="flex items-center gap-3 mt-2">
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
            <div className="mt-4 flex items-center gap-2 bg-warning/20 rounded-lg px-4 py-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">
                Flight delayed by {flightInfo.delayHours} hours — see recommendations below
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-2">
        {/* Smart Reminders */}
        <motion.div variants={item} className="md:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                Smart Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reminders.map((r, idx) => {
                const Icon = r.icon;
                const colorClass = typeColors[r.type];
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${colorClass}`}
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium opacity-70 mb-1">{r.timeLabel}</p>
                      <p className="text-sm font-medium text-foreground">{r.message}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Food Options */}
        <motion.div variants={item} className="md:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Utensils className="h-4 w-4 text-warning" />
                </div>
                Nearby Food Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {foodOptions.map((food, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-xl bg-muted hover:bg-muted/70 transition-colors border border-transparent hover:border-border/50 cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                      <Utensils className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-foreground">{food.name}</h4>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{food.tag}</Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{food.location}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground">{food.distance}</span>
                        <span className="text-xs text-muted-foreground">⭐ {food.rating}</span>
                        <span className="text-xs text-muted-foreground">{food.priceRange}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comfort & Rest */}
        <motion.div variants={item} className="md:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Bed className="h-4 w-4 text-accent" />
                </div>
                Comfort & Rest Nearby
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3">
                {comfortSpots.map((spot, idx) => {
                  const Icon = spot.icon;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-muted hover:bg-muted/70 transition-colors border border-transparent hover:border-border/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-accent" />
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{spot.type}</Badge>
                      </div>
                      <h4 className="font-semibold text-sm text-foreground">{spot.name}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{spot.location}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{spot.distance}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {spot.features.map((f) => (
                          <span
                            key={f}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AtAirportRec;
