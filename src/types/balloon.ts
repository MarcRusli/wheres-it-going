export type BalloonPoint = [number | null, number | null, number | null];
export type TreasureSnapshot = BalloonPoint[];
export type BalloonTrackPoint = {
  lng: number;
  lat: number;
  alt: number;
};
export type WindVector = {
  lat: number;
  lng: number;
  u: number;
  v: number;
};
export type CoordinateSet = {
  lat: number;
  lng: number;
};
export interface WeatherData {
  lat: number;
  lng: number;
  time: Date[];
  [key: string]: number[] | number | unknown;
};
