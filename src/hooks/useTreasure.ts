import { useEffect, useState } from "react";
import { fetchBalloonLocations } from "../api/treasure";
import type { BalloonTrackPoint } from "../types/balloon";

export function useTreasure() {
  const [balloonPoints, setBalloonPoints] = useState<BalloonTrackPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalloonLocations()
      .then(setBalloonPoints)
      .finally(() => setLoading(false));
  }, []);

  return { balloonPoints, loading };
}
