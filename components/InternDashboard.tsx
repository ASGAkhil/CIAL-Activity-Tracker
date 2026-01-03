
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Activity, Statistics, EligibilityResult } from '../types';
import { api } from '../services/apiService';
import { calculateStats, calculateEligibility } from '../utils/logic';
import SubmissionForm from './SubmissionForm';
import { CONFIG } from '../services/config';

interface InternDashboardProps {
  user: User;
}

const InternDashboard: React.FC<InternDashboardProps> = ({ user }) => {
  const internIdClean = user.internId.trim().toUpperCase();
  const STORAGE_KEY = `cial_activities_${internIdClean}`;

  // SYNC INITIALIZATION: Prevents "zero state" on load
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.sort((a, b) => b.date.localeCompare(a.date)) : [];
      } catch (e) { return []; }
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const isMounted = useRef(false);

  const stats = useMemo(() => calculateStats(activities), [activities]);
  const eligibility = useMemo(() => calculateEligibility(activities, user.joiningDate), [activities, user.joiningDate]);

  useEffect(() => {
    isMounted.current = true;
    fetchData(activities.length === 0);
    return () => { isMounted.current = false; };
  }, [internIdClean]);

  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    }
  }, [activities, STORAGE_KEY]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setSyncing(true);
    
    try {
      const cloudData = await api.getActivities(internIdClean);
      if (isMounted.current && cloudData.length > 0) {
        setActivities(prev => {
          const uniqueMap = new Map();
          [...prev, ...cloudData].forEach(item => {
            const key = item.id || `${item.internId}_${item.date}`;
            if (!uniqueMap.has(key)) uniqueMap.set(key, item);
          });
          return Array.from(uniqueMap.values()).sort((a, b) => b.date.localeCompare(a.date));
        });
      }
    } catch (err) {
      console.warn("Offline fallback enabled.");
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setSyncing(false);
      }
    }
  };

  const handleSubmissionSuccess = (newAct: Activity) => {
    setActivities(prev => {
      if (prev.some(a => a.date === newAct.date)) return prev;
      const updated = [newAct, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const todayStr = new Date().toLocaleDateString('en-CA');
  const hasSubmittedToday = activities.some(a => a.date === todayStr);

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Verifying Vault...</p>
    </div>
  );

  const minDaysGoal = CONFIG.PROGRAM_SETTINGS.MIN_DAYS_FOR_CERTIFICATE;
  const minHoursGoal = CONFIG.PROGRAM_SETTINGS.MIN_HOURS_PER_DAY;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Dashboard</h2>
          <p className="text-slate-500 font-semibold mt-1">
            <span className="text-blue-600">ID: {internIdClean}</span> — {user.name}
          </p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={() => fetchData(false)}
              disabled={syncing}
              className="px-6 py-3 bg-white border border-slate-200 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all flex items-center gap-3 shadow-sm active:scale-95"
            >
              <div className={`${syncing ? 'animate-spin' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <div className="px-6 py-3 rounded-[20px] bg-slate-900 text-white flex items-center gap-3 shadow-xl">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Live Status</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Days" value={stats.totalActiveDays} icon="📅" subText={`Goal: ${minDaysGoal} Days`} />
        <StatCard title="Daily Avg" value={`${stats.averageHours.toFixed(1)}h`} icon="⏰" subText={`Target: ≥ ${minHoursGoal}h`} />
        <StatCard title="Streak" value={`${stats.currentStreak}d`} icon="🔥" subText="Consecutive" />
        <StatCard 
            title="Eligibility" 
            value={eligibility.isEligible ? "READY" : "PENDING"} 
            icon="🎓" 
            subText={eligibility.isEligible ? "Qualified" : "Awaiting Milestones"}
            accent={eligibility.isEligible ? "text-green-600" : "text-amber-500"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {!hasSubmittedToday ? (
            <SubmissionForm user={user} onSuccess={handleSubmissionSuccess} />
          ) : (
            <div className="bg-white border border-green-200 p-12 rounded-[48px] shadow-sm flex flex-col md:flex-row items-center gap-10">
              <div className="bg-green-600 p-8 rounded-[36px] text-white">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-3xl font-black text-slate-900 tracking-tight">Today Logged</h4>
                <p className="text-slate-500 mt-2 font-bold text-base">You've successfully secured your record for {new Date(todayStr).toLocaleDateString()}.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[48px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Official Activity Vault</h3>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{activities.length} Records Saved</span>
            </div>
            <div className="divide-y divide-slate-100">
              {activities.map((activity) => (
                <div key={activity.id} className="p-12 hover:bg-slate-50 transition-all border-l-4 border-l-transparent hover:border-l-blue-600">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-800 shadow-sm">
                        <span className="text-xl font-black">{new Date(activity.date).getDate()}</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600">{new Date(activity.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      </div>
                      <span className="text-xl font-black text-slate-900">{new Date(activity.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white">
                        {activity.hours}h Logged
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 text-sm text-slate-600 leading-relaxed font-semibold">
                    {activity.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-12 rounded-[48px] shadow-sm border border-slate-200">
            <h3 className="font-black text-slate-900 mb-12 flex items-center gap-4 text-xs uppercase tracking-[0.3em]">Compliance Check</h3>
            <div className="space-y-12">
               <ProgressBar label="Required Active Days" current={stats.totalActiveDays} target={minDaysGoal} />
               <ProgressBar label="Mean Daily Effort" current={stats.averageHours} target={minHoursGoal} unit="h" />
               <div className="pt-12 border-t border-slate-100">
                  <ul className="space-y-6">
                    <CheckItem label={`${minDaysGoal} Active Days`} checked={stats.totalActiveDays >= minDaysGoal} />
                    <CheckItem label={`High Intensity (Avg ≥ ${minHoursGoal}h)`} checked={stats.averageHours >= minHoursGoal} />
                    <CheckItem label="Consistent (Gap ≤ 3 Days)" checked={eligibility.maxGapDays <= 3 && activities.length > 0} />
                  </ul>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, subText, accent }: any) => (
  <div className="bg-white p-12 rounded-[48px] shadow-sm border border-slate-200 hover:border-blue-400 transition-all group">
    <div className="flex justify-between items-start mb-10">
      <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-3xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">{icon}</div>
      <span className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em]">{title}</span>
    </div>
    <div className={`text-5xl font-black tracking-tighter ${accent || 'text-slate-900'}`}>{value}</div>
    <p className="text-[11px] text-slate-400 mt-4 font-black uppercase tracking-[0.2em]">{subText}</p>
  </div>
);

const ProgressBar = ({ label, current, target, unit = '' }: any) => {
    const pct = Math.min((current / target) * 100, 100);
    return (
        <div className="space-y-5">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-900">{current.toFixed(1)}{unit} / {target}{unit}</span>
            </div>
            <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden p-1.5 shadow-inner">
                <div 
                    className="h-full rounded-full transition-all duration-1000 bg-slate-900 shadow-xl shadow-slate-200" 
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

const CheckItem = ({ label, checked }: any) => (
    <li className="flex items-center gap-5 text-[11px] font-black uppercase tracking-[0.2em]">
        <div className={`w-7 h-7 rounded-2xl flex items-center justify-center text-white ${checked ? 'bg-green-500 shadow-lg' : 'bg-slate-200'}`}>
            {checked && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
        </div>
        <span className={checked ? 'text-slate-900' : 'text-slate-400 opacity-60'}>{label}</span>
    </li>
);

export default InternDashboard;
