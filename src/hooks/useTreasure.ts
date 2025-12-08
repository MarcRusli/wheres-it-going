import { useEffect, useState } from "react";
import { fetchBalloonLocations } from "../api/treasure";
import type { BalloonTrackPoint } from "../types/balloon";

export function useTreasure(balloonId: number) {
  const [balloonPoints, setBalloonPoints] = useState<BalloonTrackPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalloonLocations(balloonId)
      .then(setBalloonPoints)
      .finally(() => setLoading(false));
  }, [balloonId]);

  return { balloonPoints, loading };
}
