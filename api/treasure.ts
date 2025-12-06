/* export const config = {
  runtime: "edge",
};


export type BalloonPoint = [number, number, number];
export type TreasureData = BalloonPoint[];


let cachedData: TreasureData | null = null;
let lastFetch = 0;

const CACHE_TTL = 10_000; // 10 seconds

export default async function handler(): Promise<Response> {
  console.log("starting async handler on /api/treasure.ts");
  const now = Date.now();


  if (cachedData && now - lastFetch < CACHE_TTL) {
    return new Response(JSON.stringify(cachedData), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=10",
      },
    });
  }

  const res = await fetch("https://a.windbornesystems.com/treasure/00.json");

  if (!res.ok) {
    return new Response(JSON.stringify({ error: "Treasure fetch failed" }), {
      status: 500,
    });
  }

  console.log("res:", res);


  const data = (await res.json()) as TreasureData;

  cachedData = data;
  lastFetch = now;

  return new Response(
    JSON.stringify(data),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=10",
      },
    }
  );
}
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export type BalloonPoint = [number, number, number];
export type TreasureData = BalloonPoint[];

let cachedData: TreasureData | null = null;
let lastFetch = 0;

const CACHE_TTL = 10_000;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {

  const now = Date.now();
  
  if (cachedData && now - lastFetch < CACHE_TTL) {
    return res.status(200).json(cachedData);
  }

  const response = await fetch(
    "https://a.windbornesystems.com/treasure/00.json"
  );

  if (!response.ok) {
    return res.status(500).json({ error: "Treasure fetch failed" });
  }

  const data = (await response.json()) as TreasureData;

  cachedData = data;
  lastFetch = now;

  res.status(200).json(data);
}
