import { useEffect, useState } from "react";
import { fetchTreasureData, type BalloonPoint } from "../api/treasure";

export function useTreasure() {
  const [data, setData] = useState<BalloonPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTreasureData()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
