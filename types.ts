
export enum UserRole {
  INTERN = 'INTERN',
  ADMIN = 'ADMIN'
}

export enum ActivityCategory {
  LEARNING = 'Learning',
  PRACTICE = 'Practice',
  ASSIGNMENT = 'Assignment',
  PROJECT = 'Project',
  RESEARCH = 'Research'
}

export interface Activity {
  id: string;
  internId: string;
  date: string; // ISO Date
  timestamp: string;
  hours: number; // 2, 3+
  category: ActivityCategory;
  description: string;
  proofLink?: string;
  qualityScore?: number; // 1-10 (AI Generated)
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  internId: string;
  joiningDate: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  activeDays: number;
  averageHours: number;
  maxGapDays: number;
  reasons: string[];
}

export interface Statistics {
  totalActiveDays: number;
  averageHours: number;
  currentStreak: number;
  totalSubmissions: number;
}
