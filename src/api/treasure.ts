import type { BalloonTrackPoint, TreasureSnapshot } from "../types/balloon";

export async function fetchBalloonLocations(balloonId: number, timeSpan: number): Promise<BalloonTrackPoint[]> {
  // add 2 to timeSpan to account for current hr
  // e.g. it's 10:20pm now. If we want to go 5 hours back, we need 7 data points.
  // we will just accept that there will be extra time between now and most recent hour mark
  // 10:20, 10:00, 9:00, 8:00, 7:00, 6:00, 5:00 
  const requests = Array.from({ length: timeSpan + 2 }, (_, i) =>
    fetch(`/api/treasure?hour=${i}`).then((res) => {
      if (!res.ok) throw new Error(`Failed hour ${i}`);
      return res.json() as Promise<TreasureSnapshot>;
    })
  );

  const snapshots = await Promise.all(requests);

  const track: BalloonTrackPoint[] = snapshots
    .map((snapshot) => {
      const [lat, lon, alt] = snapshot[balloonId] ?? [null, null, null]; // sometimes windborne api gives 404

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
