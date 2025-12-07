import { useEffect, useState } from "react";
import { fetchBalloonLocations } from "../api/treasure";
import type { BalloonPoint } from "../types/balloon";

export function useTreasure() {
  const [data, setData] = useState<BalloonPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalloonLocations()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
