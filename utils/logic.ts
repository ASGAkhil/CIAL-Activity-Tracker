
import { Activity, EligibilityResult, Statistics } from '../types';

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

  const reasons: string[] = [];
  if (activeDays < 60) reasons.push(`Requires 60 active days (Current: ${activeDays})`);
  if (averageHours < 2.5) reasons.push(`Average hours must be ≥ 2.5 (Current: ${averageHours.toFixed(1)})`);
  if (maxGap > 3) reasons.push(`Maximum gap exceeded 3 consecutive days (Worst gap: ${maxGap} days)`);

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

  // Robust Streak Logic
  let streak = 0;
  const dateStrs = Array.from(uniqueDates).sort().reverse(); // Newest dates first
  
  if (dateStrs.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If latest log isn't today OR yesterday, streak is broken
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
