import { useEffect, useState } from "react";
import { fetchBalloonLocations } from "../api/treasure";
import type {
  BalloonTrackPoint,
  CoordinateSet,
} from "../types/balloon";
import { fetchWindVectors } from "../api/openMeteo";
import { generateGridFromPath } from "../utils/grid";

// DON'T DELETE UNTIL new hook works!
/* export function useBalloonPathFetch(balloonId: number, timeSpan: number) {
  const [balloonPoints, setBalloonPoints] = useState<BalloonTrackPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      await fetchBalloonLocations(balloonId, timeSpan)
        .then(setBalloonPoints)
        .then(() => console.log("balloon points right after fetch:"))
        .finally(() => setLoading(false));

      console.log("asdf. this is supposed to happen after setballoonpoints and setlaoding to false")
    }
    loadData();
  }, [balloonId, timeSpan]);

  return { balloonPoints, loading };
} */

export function useMapData(balloonId: number, timeSpan: number) {
  const [balloonPoints, setBalloonPoints] = useState<BalloonTrackPoint[]>([]);
  const [windPoints, setWindPoints] = useState<CoordinateSet[]>([]);
  const [windVectors, setWindVectors] = useState<object[]>([]);
  const [predictedPoints, setPredictedPoints] = useState<BalloonTrackPoint[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // First fetch real balloon path data
      const windBorneData = await fetchBalloonLocations(balloonId, timeSpan);
      setBalloonPoints(windBorneData);
      console.log("balloon points right after fetch:", windBorneData);

      // TEST STUFF

      // Generate wind grid coordinates
      const windGridCoords = generateGridFromPath(windBorneData, 5, 1);

      // Fetch wind components at each coordinate
      const windGridVectors = await fetchWindVectors(
        windGridCoords,
        new Date("2025-12-11T10:00"),
        new Date("2025-12-11T14:00")
      );
      console.log("fetchWindVectors result:", windGridVectors);

      setWindPoints(windGridCoords);
      setWindVectors(windGridVectors);

      setPredictedPoints([]);
      console.log("now it is", new Date().toISOString().substring(0, 16));

      // Build predicted balloon path based on starting point
      //const predicted = await buildPredictedPath(windBorneData[0]);
      //setPredictedPoints(predicted);

      setLoading(false);
    }

    loadData();
  }, [balloonId, timeSpan]);

  return { balloonPoints, predictedPoints, windPoints, windVectors, loading };
}

/* async function buildPredictedPath(startPoint: BalloonTrackPoint) {
  const path: BalloonTrackPoint[] = [startPoint];

  // Build points for each time step
  for (let i = 0; i < asdf; i++) {
    // Set current position to most recent point in path
    const curPosition = path[path.length - 1];
    // Predict and add new position to path
    path.push(await predictNextPosition(curPosition));
  }

  return path;
}

async function predictNextPosition(curPosition: BalloonTrackPoint) {
  const curWind = await getWindVectorAt(curPosition);
  const roughNextPosition = calcRoughNextPosition(curPosition, curWind, timeStep);
  const roughNextWind = await getWindVectorAt(roughNextPosition);
  return calcNextPosition(curPosition, curWind, roughNextWind, timeStep);
}

async function getWindVectorAt(position: BalloonTrackPoint) {
  
}

// Calculates next position assuming wind velocity stays constant throughout the time step
function calcRoughNextPosition(curPosition: BalloonTrackPoint, curWind: WindVector, timeStep: number) {
  const dLng = convertKmToDeg(curWind.u * timeStep);
  const dLat = convertKmToDeg(curWind.v * timeStep);
  return {
    lng: curPosition.lng + dLng,
    lat: curPosition.lat + dLat,
    alt: ,
  }
}

function calcNextPosition(curPosition: BalloonTrackPoint, curWind: WindVector, roughNextWind: WindVector) {
  const uAccel = curWind.u 
  const dLng = convertKmToDeg(curWind.u * timeStep + 0.5 * uAccel * timeStep ** 2);
  const dLat = convertKmToDeg(curWind.v * timeStep + 0.5 * vAccel * timeStep ** 2);
}

function convertKmToDeg(km: number) {

  return deg;
}

// Open-meteo takes data at an array of discrete pressure levels that roughly correspond to altitude
// Use this to get the nearest two pressure levels
function calcNearestTwoPressureLevels(altitude: number) {
  const levels = [
    1000, 975, 950, 925, 900, 850, 800, 700, 600, 500, 400, 300, 250, 200, 150,
    100, 70, 50, 30,
  ];

  // if pressure is lower or higher than range in openmeteo's levels, return only one pressure level
} */
