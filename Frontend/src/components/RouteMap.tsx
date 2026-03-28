import maplibregl, { type LngLatBoundsLike, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";

type RouteResponse = {
  origin: {
    query: string;
    label: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    query: string;
    label: string;
    latitude: number;
    longitude: number;
  };
  route: {
    distanceMeters: number;
    durationSeconds: number;
    geometry: {
      type: "LineString";
      coordinates: [number, number][];
    };
    steps: Array<{
      name: string;
      instruction: string;
      distanceMeters: number;
      durationSeconds: number;
    }>;
  };
};

type RouteMapProps = {
  origin: string;
  destination: string;
  originLabel: string;
  destinationLabel: string;
  onRouteLoaded?: (summary: {
    durationMinutes: number;
    distanceMiles: number;
    firstInstruction: string;
  }) => void;
};

const mapStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
} as const;

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

const RouteMap = ({
  origin,
  destination,
  originLabel,
  destinationLabel,
  onRouteLoaded,
}: RouteMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const mapRef = useRef<Map | null>(null);
  const onRouteLoadedRef = useRef(onRouteLoaded);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);

  useEffect(() => {
    onRouteLoadedRef.current = onRouteLoaded;
  }, [onRouteLoaded]);

  useEffect(() => {
    let disposed = false;

    async function loadRoute() {
      if (!containerRef.current) {
        return;
      }

      cleanupRef.current?.();
      cleanupRef.current = null;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/maps/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "Unable to load map directions");
        }

        const data = (await response.json()) as RouteResponse;

        if (disposed || !containerRef.current) {
          return;
        }

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: mapStyle,
          center: [data.origin.longitude, data.origin.latitude],
          zoom: 10,
          attributionControl: false,
        });

        mapRef.current = map;

        new maplibregl.Marker({ color: "#0f172a" })
          .setLngLat([data.origin.longitude, data.origin.latitude])
          .setPopup(new maplibregl.Popup({ offset: 16 }).setText(originLabel))
          .addTo(map);

        new maplibregl.Marker({ color: "#06b6d4" })
          .setLngLat([data.destination.longitude, data.destination.latitude])
          .setPopup(new maplibregl.Popup({ offset: 16 }).setText(destinationLabel))
          .addTo(map);

        map.on("load", () => {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: data.route.geometry,
              properties: {},
            },
          });

          map.addLayer({
            id: "route-shadow",
            type: "line",
            source: "route",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#0f172a",
              "line-width": 10,
              "line-opacity": 0.14,
            },
          });

          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#0ea5e9",
              "line-width": 6,
            },
          });

          const bounds = data.route.geometry.coordinates.reduce(
            (accumulator, coordinate) => accumulator.extend(coordinate),
            new maplibregl.LngLatBounds(
              data.route.geometry.coordinates[0],
              data.route.geometry.coordinates[0],
            ),
          );

          map.fitBounds(bounds as LngLatBoundsLike, {
            padding: 48,
            duration: 800,
          });
        });

        const miles = data.route.distanceMeters * 0.000621371;
        const minutes = data.route.durationSeconds / 60;
        const firstInstruction =
          data.route.steps.find((step) => step.instruction)?.instruction || "Head toward the airport";

        setDistanceMiles(miles);
        setDurationMinutes(minutes);
        onRouteLoadedRef.current?.({
          durationMinutes: minutes,
          distanceMiles: miles,
          firstInstruction,
        });
        setIsLoading(false);

        cleanupRef.current = () => {
          map.remove();
          mapRef.current = null;
        };
      } catch (routeError) {
        if (!disposed) {
          setError(routeError instanceof Error ? routeError.message : "Unable to load the live map");
          setIsLoading(false);
        }
      }
    }

    loadRoute();

    return () => {
      disposed = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [destination, destinationLabel, origin, originLabel]);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border border-border/60">
        <div ref={containerRef} className="h-[320px] w-full bg-slate-100" />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur">
          Live route preview
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/75 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg">
              <Navigation className="h-4 w-4 animate-pulse text-primary" />
              Loading route map...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-6">
            <div className="max-w-xs rounded-2xl border border-destructive/20 bg-card p-4 text-center shadow-lg">
              <MapPin className="mx-auto mb-2 h-6 w-6 text-destructive" />
              <p className="text-sm font-semibold text-foreground">Map unavailable</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/70 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Start</p>
          <p className="mt-1 text-sm font-medium text-foreground">{originLabel}</p>
        </div>
        <div className="rounded-xl bg-muted/70 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Destination</p>
          <p className="mt-1 text-sm font-medium text-foreground">{destinationLabel}</p>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs text-muted-foreground">Estimated drive</p>
          <p className="text-lg font-bold text-foreground">{formatDuration(durationMinutes)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="text-sm font-semibold text-foreground">
            {distanceMiles != null && !Number.isNaN(distanceMiles) ? `${distanceMiles.toFixed(1)} mi` : "--"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
