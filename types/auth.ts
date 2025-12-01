export type UserPlan = 'free' | 'solo' | 'studio' | 'brand';

export interface User {
  id: string;
  email: string;
  plan: UserPlan;
  role?: 'user' | 'admin';
  generationsUsed: number;
  dailyGenerationsUsed: number;
  dailyVideosUsed: number;
  hdGenerationsUsed: number;
  uhdGenerationsUsed: number;
  dailyHdUsed: number;
  dailyUhdUsed: number;
  videosGeneratedMonthly: number;
  videosGeneratedDaily: number;
  lastVideoGenerationDate: string;
  lastGenerationDate: string;
}