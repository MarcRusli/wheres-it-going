import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTreasure } from "../hooks/useTreasure";
import type { FeatureCollection, LineString, Point } from "geojson";
import type { LngLatLike } from "maplibre-gl";
import "./Map.css";

type MapViewProps = {
  balloonId: number;
};

const MapView = ({ balloonId }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const endMarkerRef = useRef<maplibregl.Marker | null>(null);

  console.log("MapView rendered");
  const { balloonPoints, loading } = useTreasure(balloonId);
  console.log("balloonPoints:", balloonPoints);
  console.log("loading?", loading); // do somehting with this loading thing at some point

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
      console.log("map loaded!");
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
      if (!map) {
        console.log("no map");
      } else if (!mapLoaded) {
        console.log("no mapLoaded");
      } else if (balloonPoints.length === 0) {
        console.log("no balloon points");
      }
      return;
    }

    /* function computeBearing(
      lng1: number,
      lat1: number,
      lng2: number,
      lat2: number
    ) {
      const toRad = (d: number) => (d * Math.PI) / 180;
      const toDeg = (r: number) => (r * 180) / Math.PI;

      const dLng = toRad(lng2 - lng1);
      const lat1Rad = toRad(lat1);
      const lat2Rad = toRad(lat2);

      const y = Math.sin(dLng) * Math.cos(lat2Rad);
      const x =
        Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

      const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
      console.log(`computing:
        lng1=${lng1}, lat1=${lat1}
        lng2=${lng2}, lat2=${lat2}
        bearing=${bearing} deg`
      )
      return 0;
    } */

    const lineSegmentsGeoJSON: FeatureCollection<
      LineString,
      { altitude: number } //; bearing: number }
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

    //
    function getSnapshotTimestamp(index: number, totalPoints: number) {
      const now = new Date();
      const latestIndex = totalPoints - 1;

      // How far from the end this point is
      const age = latestIndex - index;

      // Latest point → exact current time
      if (age === 0) {
        return now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
          timestamp: getSnapshotTimestamp(i, balloonPoints.length),
        },
        geometry: {
          type: "Point",
          coordinates: [p.lng, p.lat],
        },
      })),
    };

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

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.on("mouseenter", "balloon-points-layer", (e) => {
      map.getCanvas().style.cursor = "pointer";

      const feature = e.features?.[0];
      if (!feature) return;

      const { lat, lng, altitude, timestamp } = feature.properties;
      const lngLat: LngLatLike = [lng, lat];
      const html = `
        <div style="font-size: 13px;">
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
    });

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
  }, [balloonPoints, mapLoaded, balloonId]);

  return (
    <div
      id="map"
      ref={mapContainer}
      style={{ width: "100%", height: "80vh", display: "block" }}
    />
  );
};

export default MapView;
