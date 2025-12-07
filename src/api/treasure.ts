import type { BalloonPoint } from "../types/balloon";

export async function fetchBalloonLocations(): Promise<BalloonPoint[]> {
  // Fetch 00 to 06 in parallel
  const requests = Array.from({ length: 7 }, (_, i) =>
    fetch(`/api/treasure?hour=${i}`).then((res) => {
      if (!res.ok) throw new Error(`Failed hour ${i}`);
      return res.json() as Promise<BalloonPoint[]>;
    })
  );

  const snapshots = await Promise.all(requests);

  // Extract FIRST balloon from each hour
  const track: BalloonPoint[] = snapshots.map((snapshot) => {
    const [lat, lon, alt] = snapshot[0];
    return [lon, lat, alt];
  });


  return track.reverse();
}
