export type BalloonPoint = [number, number, number];

export async function fetchTreasureData(): Promise<BalloonPoint[]> {
  const res = await fetch("/api/treasure");

  if (!res.ok) {
    throw new Error("Failed to fetch treasure data");
  }

  return res.json();
}
