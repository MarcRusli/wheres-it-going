/* import { fetchWeatherApi } from "openmeteo";
import type { CoordinateSet, WeatherData } from "../types/balloon";

export async function fetchWindVectors(
  positions: CoordinateSet[],
  startTime: Date,
  endTime: Date
) {
  // Build params for query
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
    start_date: "2025-12-11",
    end_date: "2025-12-11",
    //start_hour: startTime.toISOString().substring(0, 16),
    //end_hour: endTime.toISOString().substring(0, 16),
  };

  // Query open-meteo
  const url = "https://api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);
  console.log("responses:", responses)

  // Build output from response
  const data: WeatherData[] = [];
  for (const response of responses) {
    // Attributes for timezone and location
    //const latitude = response.latitude();
    //const longitude = response.longitude();
    // const elevation = response.elevation();
    const utcOffsetSeconds = response.utcOffsetSeconds();

    const hourly = response.hourly()!;
    console.log("hourly:", hourly);
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
      lat: response.latitude(),
      lng: response.longitude(),
      //wind_u_component: hourly.variables(0)!.valuesArray(),
      //wind_v_component: hourly.variables(1)!.valuesArray(),
      //geopotential_height: hourly.variables(2)!.valuesArray(),
    };
    for (let i = 0; i < weatherVars.length; i++) {
      weatherData.hourly[weatherVars[i]] = hourly.variables(i)!.valuesArray();
    }

    // The 'weatherData' object now contains a simple structure, with arrays of datetimes and weather information
    console.log("\nhourly data:\n", weatherData.hourly);
  }

  return data;
} */

import { fetchWeatherApi } from "openmeteo";
import type { CoordinateSet, WeatherData } from "../types/balloon";

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
  const responses = await fetchWeatherApi(url, params);

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
