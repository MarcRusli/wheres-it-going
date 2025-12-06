import { useEffect, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTreasure } from "../hooks/useTreasure";

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  console.log('MapView rendered');
  const treasureData = useTreasure();
  console.log(treasureData);

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

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Plot first balloon
  /* useEffect(() => {
    if (!data || !mapRef.current) return;

    const [lng, lat] = data[0];

    new maplibregl.Marker().setLngLat([lng, lat]).addTo(mapRef.current);

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 5,
    });
  }, [data]);

  if (loading) return <div>Loading balloon data…</div>;
  if (error) return <div>Error: {error}</div>; */

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
};

export default MapView;
