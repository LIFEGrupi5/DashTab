import { apiGet } from './client';

export type ForecastPoint = {
  date: string;
  day: string;
  predicted: number;
  lower: number;
  upper: number;
};

export type RevenueForecast = {
  forecast: ForecastPoint[];
  message: string | null;
};

export const fetchForecast = () => apiGet<RevenueForecast>('/analytics/forecast');
