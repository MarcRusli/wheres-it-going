import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTreasure } from "../hooks/useTreasure";
import type { FeatureCollection, LineString, Point } from "geojson";

type MapViewProps = {
  balloonId: number;
};

const MapView = ({ balloonId }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  console.log("MapView rendered");
  const { balloonPoints, loading } = useTreasure(balloonId);
  console.log(balloonPoints);
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

  // Plot balloons
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
    console.log("balloonId:", balloonId);

    function computeBearing(
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

      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }

    const lineSegmentsGeoJSON: FeatureCollection<
      LineString,
      { altitude: number; bearing: number }
    > = {
      type: "FeatureCollection",
      features: balloonPoints.slice(0, -1).map((p, i) => {
        const next = balloonPoints[i + 1];

        return {
          type: "Feature",
          properties: {
            altitude: p.alt,
            bearing: computeBearing(p.lng, p.lat, next.lng, next.lat),
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

    const pointGeoJSON: FeatureCollection<
      Point,
      { hour: number; altitude: number }
    > = {
      type: "FeatureCollection",
      features: balloonPoints.map((p, i) => ({
        type: "Feature",
        properties: {
          hour: i,
          altitude: p.alt,
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
            ["rgb", 0, 128, 255],
            10,
            ["rgb", 0, 200, 100],
            20,
            ["rgb", 255, 80, 80],
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
          "icon-rotate": ["+", ["get", "bearing"], 90],
          // add 90 deg due to arrow sprite pointing to the right instead of up
          // TODO: fix arrows not pointing exactly in the direction of the next point. Arrow spacing is weird as well.
        },
      });
    }

    // POINT SOURCE
    if (!map.getSource("altitude-points")) {
      map.addSource("altitude-points", {
        type: "geojson",
        data: pointGeoJSON,
      });

      map.addLayer({
        id: "altitude-points-layer",
        type: "circle",
        source: "altitude-points",
        paint: {
          "circle-radius": 6,

          // Color by altitude value
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "altitude"],
            0,
            ["rgb", 0, 128, 255], // low alt = blue
            10,
            ["rgb", 0, 200, 100], // mid alt = green
            20,
            ["rgb", 255, 80, 80], // high alt = red
          ],

          "circle-stroke-width": 1,
          "circle-stroke-color": "#000",
        },
      });
    } else {
      (map.getSource("altitude-points") as maplibregl.GeoJSONSource).setData(
        pointGeoJSON
      );
    }

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
