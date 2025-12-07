import type { BalloonTrackPoint, TreasureSnapshot } from "../types/balloon";

export async function fetchBalloonLocations(): Promise<BalloonTrackPoint[]> {
  const requests = Array.from({ length: 7 }, (_, i) =>
    fetch(`/api/treasure?hour=${i}`).then((res) => {
      if (!res.ok) throw new Error(`Failed hour ${i}`);
      return res.json() as Promise<TreasureSnapshot>;
    })
  );

  const snapshots = await Promise.all(requests);

  const track: BalloonTrackPoint[] = snapshots
    .map((snapshot) => {
      const [lat, lon, alt] = snapshot[0] ?? [null, null, null]; // sometimes windborne api gives 404

      if (lat == null || lon == null || alt == null) return null;

      return {
        lng: lon,
        lat: lat,
        alt: alt,
      };
    })
    .filter((p): p is BalloonTrackPoint => p !== null)
    .reverse(); // oldest → newest

  return track;
}
