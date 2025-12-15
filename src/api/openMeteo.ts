import { fetchWeatherApi } from "openmeteo";
import type { CoordinateSet, WeatherData } from "../types/balloon";
import type { ApiError } from "../components/OpenMeteoStatusBanner";

export async function fetchWindVectors(
  positions: CoordinateSet[],
  startTime: Date,
  endTime: Date
) {
  const pressureLevels = [
    1000, 975, 950, 925, 900, 850, 800, 700, 600, 500, 400, 300, 250, 200, 150,
    100, 70, 50, 30,
  ];
  const weatherVars: string[] = [];
  const lats: number[] = [];
  const lngs: number[] = [];
  for (const pressure of pressureLevels) {
    weatherVars.push(
      `wind_u_component_${pressure}hPa`,
      `wind_v_component_${pressure}hPa`,
      `geopotential_height_${pressure}hPa`
    );
  }
  for (const position of positions) {
    lats.push(position.lat);
    lngs.push(position.lng);
  }

  const params = {
    latitude: lats,
    longitude: lngs,
    hourly: weatherVars,
    start_hour: startTime.toISOString().substring(0, 16),
    end_hour: endTime.toISOString().substring(0, 16),
  };
  const url = "https://api.open-meteo.com/v1/forecast";

  let responses;
  try {
    responses = await fetchWeatherApi(url, params);
  } catch (err: unknown) {
    let message = "Failed to fetch wind data from Open-Meteo";

    if (err instanceof Error && typeof err.message === "string") {
      message = err.message;
    }

    throw {
      message,
      source: "open-meteo",
    } satisfies ApiError;
  }

  // Process 3 locations
  const data: WeatherData[] = [];
  for (const response of responses) {
    // Attributes for timezone and location
    const latitude = response.latitude();
    const longitude = response.longitude();
    // const elevation = response.elevation();
    const utcOffsetSeconds = response.utcOffsetSeconds();

    const hourly = response.hourly()!;

    // Note: The order of weather variables in the URL query and the indices below need to match!
    const weatherData: WeatherData = {
      time: Array.from(
        {
          length:
            (Number(hourly.timeEnd()) - Number(hourly.time())) /
            hourly.interval(),
        },
        (_, i) =>
          new Date(
            (Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) *
              1000
          )
      ),
      lat: latitude,
      lng: longitude,
    };
    for (let i = 0; i < weatherVars.length; i++) {
      weatherData[weatherVars[i]] = hourly.variables(i)!.valuesArray();
    }

    data.push(weatherData);
  }

  return data;
}
