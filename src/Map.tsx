import { useEffect, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json", // free public style
      center: [-122.4194, 37.7749], // [lng, lat] (San Francisco)
      zoom: 10,
    });

    // Optional controls
    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100vh",
      }}
    />
  );
};

export default MapView;
