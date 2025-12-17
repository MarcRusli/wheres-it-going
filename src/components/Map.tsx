import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapData } from "../hooks/useMapData";
import type { FeatureCollection, LineString, Point } from "geojson";
import "./Map.css";
import type { ApiError } from "./OpenMeteoStatusBanner";

type MapViewProps = {
  balloonId: number;
  pressure: number;
  setWindTimes: React.Dispatch<React.SetStateAction<Date[]>>;
  hourIndex: number;
  setError: React.Dispatch<React.SetStateAction<ApiError | null>>;
};

const MapView = ({
  balloonId,
  pressure,
  setWindTimes,
  hourIndex,
  setError,
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const endMarkerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // TODO: implement way to adjust time span instead of hardcoding 5 hrs
  const TIME_SPAN = 5;
  const { balloonPoints, windVectors } = useMapData(
    balloonId,
    TIME_SPAN,
    setError
  );

  // Init map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [0, 0],
      zoom: 2,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current = map;

    map.on("load", async () => {
      setMapLoaded(true);

      try {
        const resp = await map.loadImage("/map-arrow-right.png");
        if (resp && resp.data && !map.hasImage("arrow-icon")) {
          map.addImage("arrow-icon", resp.data, { pixelRatio: 2 });
        }
      } catch (err) {
        console.error("Failed to load local arrow image", err);
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Plot balloon
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapLoaded || balloonPoints.length === 0) {
      return;
    }

    const lineSegmentsGeoJSON: FeatureCollection<
      LineString,
      { altitude: number }
    > = {
      type: "FeatureCollection",
      features: balloonPoints.slice(0, -1).map((p, i) => {
        const next = balloonPoints[i + 1];

        return {
          type: "Feature",
          properties: {
            altitude: p.alt,
            // bearing: computeBearing(p.lng, p.lat, next.lng, next.lat),
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [p.lng, p.lat],
              [next.lng, next.lat],
            ],
          },
        };
      }),
    };

    // Calculates timestamp based on point's position in data array
    // Latest point → exact current time, but only if we have all data points (sometimes we have one less)
    // 00.json (latest time stamp) returns 404 for some amount of time after the hour mark passes
    // TODO: (THIS MIGHT BE UNFIXABLE UNTIL WINDBORNE PUTS TIMESTAMPS ON THEIR DATA)
    // TODO: fix edge case where say it's 12:03 now, but 00.json still reads 11:00's data.
    function getSnapshotTimestamp(index: number) {
      const now = new Date();
      const latestIndex = TIME_SPAN + 1;

      // How far from the end this point is
      const age = latestIndex - index;

      if (age === 0) {
        return now.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });
      }

      // Round current time down to nearest hour for the second-most recent point
      const rounded = new Date(now);
      rounded.setMinutes(0, 0, 0);

      // Example:
      // age = 1 → rounded
      // age = 2 → rounded - 1 hour
      // age = 3 → rounded - 2 hours, ...
      const ts = new Date(rounded.getTime() - (age - 1) * 60 * 60 * 1000);
      return ts.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    const pointGeoJSON: FeatureCollection<Point, { altitude: number }> = {
      type: "FeatureCollection",
      features: balloonPoints.map((p, i) => ({
        type: "Feature",
        properties: {
          lat: p.lat,
          lng: p.lng,
          altitude: p.alt,
          timestamp: getSnapshotTimestamp(i),
        },
        geometry: {
          type: "Point",
          coordinates: [p.lng, p.lat],
        },
      })),
    };

    function offsetKmToLatLon(
      lat: number,
      lng: number,
      dxKm: number,
      dyKm: number
    ) {
      const R = 6371; // km
      const dLat = (dyKm / R) * (180 / Math.PI);
      const dLng =
        (dxKm / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);

      return {
        lat: lat + dLat,
        lng: lng + dLng,
      };
    }

    function buildWindVectorGrid(
      windVectors: Record<string, unknown>[],
      pressure: number,
      hourIndex: number
    ) {
      if (windVectors.length === 0) {
        return [];
      }
      return windVectors.map((vec) => {
        const obj = vec as Record<string, number[] | number>;
        const u = (obj[`wind_u_component_${pressure}hPa`] as number[])[
          hourIndex
        ];
        const v = (obj[`wind_v_component_${pressure}hPa`] as number[])[
          hourIndex
        ];
        return {
          lat: obj.lat as number,
          lng: obj.lng as number,
          u,
          v,
        };
      });
    }

    if (windVectors.length !== 0) {
      setWindTimes(windVectors[0].time);
    }
    const windVectorGrid = buildWindVectorGrid(
      windVectors,
      pressure,
      hourIndex
    );

    const windVectorGeoJson: FeatureCollection<LineString> = {
      type: "FeatureCollection",
      features: windVectorGrid.map((g) => {
        const tip = offsetKmToLatLon(g.lat, g.lng, g.u, g.v);

        return {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [g.lng, g.lat],
              [tip.lng, tip.lat],
            ],
          },
          properties: {
            magnitude: Math.sqrt(g.u * g.u + g.v * g.v),
          },
        };
      }),
    };

    if (!map.getSource("wind-vectors")) {
      map.addSource("wind-vectors", {
        type: "geojson",
        data: windVectorGeoJson,
      });
    } else {
      const src = map.getSource("wind-vectors") as maplibregl.GeoJSONSource;
      src.setData(windVectorGeoJson);
    }
    if (!map.getLayer("wind-vectors-layer")) {
      map.addLayer({
        id: "wind-vectors-layer",
        type: "line",
        source: "wind-vectors",
        paint: {
          "line-color": "#d7191c",
          "line-width": [
            "interpolate",
            ["linear"],
            ["get", "magnitude"],
            0,
            1,
            50,
            5,
          ],
        },
      });
    }

    // wind arrow layer
    if (!map.getLayer("wind-direction-arrows")) {
      map.addLayer({
        id: "wind-direction-arrows",
        type: "symbol",
        source: "wind-vectors",
        layout: {
          "symbol-placement": "line",
          "symbol-spacing": 20,
          "icon-image": "arrow-icon",
          "icon-size": 1.5,
          "icon-allow-overlap": true,
        },
      });
    }

    // LINE SOURCE
    if (!map.getSource("altitude-line")) {
      map.addSource("altitude-line", {
        type: "geojson",
        data: lineSegmentsGeoJSON,
      });
    } else {
      const src = map.getSource("altitude-line") as maplibregl.GeoJSONSource;
      src.setData(lineSegmentsGeoJSON);
    }
    if (!map.getLayer("altitude-line-layer")) {
      map.addLayer({
        id: "altitude-line-layer",
        type: "line",
        source: "altitude-line",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": 4,
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "altitude"],
            0,
            ["rgb", 255, 80, 80],
            10,
            ["rgb", 0, 200, 100],
            20,
            ["rgb", 0, 128, 255],
          ],
        },
      });
    }

    // DIRECTIONAL ARROW SOURCE
    if (!map.getLayer("direction-arrows")) {
      map.addLayer({
        id: "direction-arrows",
        type: "symbol",
        source: "altitude-line",
        layout: {
          "symbol-placement": "line",
          "symbol-spacing": 80,
          "icon-image": "arrow-icon",
          "icon-size": 1.7,
          "icon-allow-overlap": true,
        },
      });
    }

    // POINT SOURCE
    if (!map.getSource("balloon-points")) {
      map.addSource("balloon-points", {
        type: "geojson",
        data: pointGeoJSON,
      });

      map.addLayer({
        id: "balloon-points-layer",
        type: "circle",
        source: "balloon-points",
        paint: {
          "circle-radius": 6,

          // Color by altitude value
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "altitude"],
            0,
            ["rgb", 255, 80, 80], // low alt = red
            10,
            ["rgb", 0, 200, 100], // mid alt = green
            20,
            ["rgb", 0, 128, 255], // high alt = blue
          ],

          "circle-stroke-width": 1,
          "circle-stroke-color": "#000",
        },
      });
    } else {
      (map.getSource("balloon-points") as maplibregl.GeoJSONSource).setData(
        pointGeoJSON
      );
    }

    if (!popupRef.current) {
      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      });
    }

    const popup = popupRef.current;

    const handleMouseEnter = (e: maplibregl.MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";

      const feature = e.features?.[0];
      if (!feature || !popup) return;

      const props = feature.properties as {
        lat: number;
        lng: number;
        altitude: number;
        timestamp: string;
      };

      popup
        .setLngLat([props.lng, props.lat])
        .setHTML(
          `
        <div style="font-size: 13px; color: black">
          <strong>Time:</strong> ${props.timestamp}<br/>
          <strong>Latitude:</strong> ${props.lat.toFixed(4)}<br/>
          <strong>Longitude:</strong> ${props.lng.toFixed(4)}<br/>
          <strong>Altitude:</strong> ${props.altitude.toFixed(2)} km
        </div>
      `
        )
        .addTo(map);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      popup?.remove();
    };

    map.on("mouseenter", "balloon-points-layer", handleMouseEnter);
    map.on("mouseleave", "balloon-points-layer", handleMouseLeave);

    /* map.on("mouseenter", "balloon-points-layer", (e) => {
      map.getCanvas().style.cursor = "pointer";

      const feature = e.features?.[0];
      if (!feature) return;

      const { lat, lng, altitude, timestamp } = feature.properties;
      const lngLat: LngLatLike = [lng, lat];
      const html = `
        <div style="font-size: 13px; color: black">
          <strong>Time:</strong> ${timestamp}<br/>
          <strong>Latitude:</strong> ${parseFloat(lat).toFixed(4)}<br/>
          <strong>Longitude:</strong> ${parseFloat(lng).toFixed(4)}<br/>
          <strong>Altitude:</strong> ${altitude.toFixed(2)} km
        </div>
      `;

      popup.setLngLat(lngLat).setHTML(html).addTo(map);
    });

    map.on("mouseleave", "balloon-points-layer", () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    }); */

    // Mark current balloon location

    // Remove previous marker if it exists
    if (endMarkerRef.current) {
      endMarkerRef.current.remove();
      endMarkerRef.current = null;
    }

    // Create a custom HTML marker so we can label it
    const el = document.createElement("div");
    el.className = "balloon-end-marker";
    el.innerHTML = `
      <div class="pin-head">${balloonId}</div>
      <div class="pin-tail"></div>
    `;

    // Add marker to the map
    const currentLng = balloonPoints[balloonPoints.length - 1].lng;
    const currentLat = balloonPoints[balloonPoints.length - 1].lat;
    const marker = new maplibregl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat([currentLng, currentLat])
      .addTo(map);

    endMarkerRef.current = marker;

    // Fit bounds
    const bounds = balloonPoints.reduce(
      (b, p) => b.extend([p.lng, p.lat]),
      new maplibregl.LngLatBounds(
        [balloonPoints[0].lng, balloonPoints[0].lat],
        [balloonPoints[0].lng, balloonPoints[0].lat]
      )
    );

    map.fitBounds(bounds, { padding: 80 });

    return () => {
      map.off("mouseenter", "balloon-points-layer", handleMouseEnter);
      map.off("mouseleave", "balloon-points-layer", handleMouseLeave);
    };
  }, [
    balloonPoints,
    windVectors,
    mapLoaded,
    balloonId,
    pressure,
    setWindTimes,
    hourIndex,
  ]);

  return (
    <div
      id="map"
      ref={mapContainer}
      style={{ width: "100%", height: "70vh", display: "block" }}
    />
  );
};

export default MapView;
