import { useEffect, useState } from "react";
import { fetchBalloonLocations } from "../api/windBorne";
import type { BalloonTrackPoint, CoordinateSet, WeatherData } from "../types/balloon";
import { fetchWindVectors } from "../api/openMeteo";
import { generateGridFromPath } from "../utils/grid";
import { getStartEndTimes } from "../utils/time";
import type { ApiError } from "../components/OpenMeteoStatusBanner";

export function useMapData(balloonId: number, timeSpan: number, setError: React.Dispatch<React.SetStateAction<ApiError | null>>) {
  const [balloonPoints, setBalloonPoints] = useState<BalloonTrackPoint[]>([]);
  const [windPoints, setWindPoints] = useState<CoordinateSet[]>([]);
  const [windVectors, setWindVectors] = useState<WeatherData[]>([]);/* Record<string, number[] | number>[]>([]); */
  const [predictedPoints, setPredictedPoints] = useState<BalloonTrackPoint[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // First fetch real balloon path data
        const windBorneData = await fetchBalloonLocations(balloonId, timeSpan);
        setBalloonPoints(windBorneData);

        // Generate wind grid coordinates
        const windGridCoords = generateGridFromPath(windBorneData, 5, 1);

        // Get timespan for wind data
        const { start, end } = getStartEndTimes(timeSpan);
        // Fetch wind components at each coordinate
        const windGridVectors = await fetchWindVectors(
          windGridCoords,
          start,
          end
        );

        setWindPoints(windGridCoords);
        setWindVectors(windGridVectors);

        setPredictedPoints([]);

        // Build predicted balloon path based on starting point
        //const predicted = await buildPredictedPath(windBorneData[0]);
        //setPredictedPoints(predicted);
      } catch (error: unknown) {
        if (typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof error.message === "string") {
          setError(error as ApiError);
        } else {
          setError({ message: "Unknown error", source: "network" });
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [balloonId, timeSpan, setError]);

  return {
    balloonPoints,
    predictedPoints,
    windPoints,
    windVectors,
    loading,
  };
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
