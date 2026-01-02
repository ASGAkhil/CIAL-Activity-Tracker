
import { Activity, EligibilityResult, Statistics } from '../types';
import { CONFIG } from '../services/config';

export const calculateEligibility = (activities: Activity[], joiningDate: string): EligibilityResult => {
  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));
  const uniqueDates = new Set(activities.map(a => a.date));
  const activeDays = uniqueDates.size;
  
  const totalHours = activities.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);
  const averageHours = activeDays > 0 ? totalHours / activeDays : 0;

  let maxGap = 0;
  if (sorted.length > 1) {
    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1].date);
      const currDate = new Date(sorted[i].date);
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) - 1;
      if (diffDays > maxGap) maxGap = diffDays;
    }
  }

  const minDays = CONFIG.PROGRAM_SETTINGS.MIN_DAYS_FOR_CERTIFICATE;
  const minHours = CONFIG.PROGRAM_SETTINGS.MIN_HOURS_PER_DAY;
  const maxAllowedGap = CONFIG.PROGRAM_SETTINGS.MAX_ALLOWED_GAP_DAYS;

  const reasons: string[] = [];
  if (activeDays < minDays) reasons.push(`Requires ${minDays} active days (Current: ${activeDays})`);
  if (averageHours < minHours) reasons.push(`Average hours must be ≥ ${minHours} (Current: ${averageHours.toFixed(1)})`);
  if (maxGap > maxAllowedGap) reasons.push(`Maximum gap exceeded ${maxAllowedGap} consecutive days (Worst gap: ${maxGap} days)`);

  return {
    isEligible: reasons.length === 0 && activeDays > 0,
    activeDays,
    averageHours,
    maxGapDays: maxGap,
    reasons
  };
};

export const calculateStats = (activities: Activity[]): Statistics => {
  if (activities.length === 0) {
    return { totalActiveDays: 0, averageHours: 0, currentStreak: 0, totalSubmissions: 0 };
  }

  const uniqueDates = new Set(activities.map(a => a.date));
  const activeDays = uniqueDates.size;
  const totalHours = activities.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);
  const averageHours = activeDays > 0 ? totalHours / activeDays : 0;

  let streak = 0;
  const dateStrs = Array.from(uniqueDates).sort().reverse(); 
  
  if (dateStrs.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStrs[0] !== todayStr && dateStrs[0] !== yesterdayStr) {
      streak = 0;
    } else {
      streak = 1;
      for (let i = 1; i < dateStrs.length; i++) {
        const d1 = new Date(dateStrs[i-1]);
        const d2 = new Date(dateStrs[i]);
        const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
        
        if (Math.round(diff) === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  return {
    totalActiveDays: activeDays,
    averageHours,
    currentStreak: streak,
    totalSubmissions: activities.length
  };
};

export const formatCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
  return `${headers}\n${rows}`;
};
