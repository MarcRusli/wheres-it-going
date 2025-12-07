import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTreasure } from "../hooks/useTreasure";
import type { FeatureCollection, LineString, Point } from "geojson";

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  console.log("MapView rendered");
  const { balloonPoints, loading } = useTreasure();
  console.log(balloonPoints);
  console.log("loading?", loading); // do somehting with this loading thing at some point

  // Init map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [0, 0],
      zoom: 2,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current.on("load", () => {
      console.log("map should've loaded here");
      setMapLoaded(true);
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
    console.log("passed!");
    // ✅ Build GeoJSON with altitude in properties
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
            altitude: p.alt, // ✅ use starting point altitude
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

    // ✅ LINE SOURCE
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

    // ✅ POINT SOURCE
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
  }, [balloonPoints, mapLoaded]);

  return (
    <div
      id="map"
      ref={mapContainer}
      style={{ width: "100%", height: "100vh" }}
    />
  );
};

export default MapView;
