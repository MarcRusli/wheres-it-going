import type { VercelRequest, VercelResponse } from "@vercel/node";

export type BalloonPoint = [number, number, number];
export type TreasureSnapshot = BalloonPoint[];
export type NullBalloonPoint = [null, null, null];
export type NullTreasureSnapshot = NullBalloonPoint[];

function createNullSnapshot(size = 1000): NullTreasureSnapshot {
  return Array.from({ length: size }, () => [null, null, null]);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const hourParam = req.query.hour ?? "0";

  if (Array.isArray(hourParam)) {
    return res.status(400).json({ error: "Invalid hour param" });
  }

  const hour = Number(hourParam);

  if (Number.isNaN(hour) || hour < 0 || hour > 23) {
    return res.status(400).json({ error: "hour must be 0–23" });
  }

  const hourStr = hour.toString().padStart(2, "0");
  const upstreamUrl = `https://a.windbornesystems.com/treasure/${hourStr}.json`;

  try {
    const upstreamRes = await fetch(upstreamUrl);

    // HARD 404 → Substitute with null snapshot
    if (upstreamRes.status === 404) {
      console.warn(`Treasure ${hourStr}.json missing → returning null snapshot`);

      const nullData = createNullSnapshot();

      res.setHeader(
        "Cache-Control",
        "s-maxage=300, stale-while-revalidate=600"
      );

      return res.status(200).json(nullData);
    }

    // Other upstream failure → 502
    if (!upstreamRes.ok) {
      return res.status(502).json({
        error: "Windborne upstream error",
        status: upstreamRes.status,
      });
    }

    const data: TreasureSnapshot = await upstreamRes.json();

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json(data);
  } catch (err) {
    console.error("Treasure fetch failed:", err);
    return res.status(500).json({ error: "Treasure fetch failed" });
  }
}
