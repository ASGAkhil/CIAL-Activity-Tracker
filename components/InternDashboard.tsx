
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Activity, Statistics, EligibilityResult } from '../types';
import { api } from '../services/apiService';
import { calculateStats, calculateEligibility } from '../utils/logic';
import SubmissionForm from './SubmissionForm';

interface InternDashboardProps {
  user: User;
}

const InternDashboard: React.FC<InternDashboardProps> = ({ user }) => {
  // STORAGE KEY for local persistence - normalized to prevent mismatches
  const internIdClean = user.internId.trim().toUpperCase();
  const STORAGE_KEY = `cial_activities_${internIdClean}`;

  // IMMEDIATE INITIALIZATION: Pull from storage before first render
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.sort((a, b) => b.date.localeCompare(a.date)) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const isMounted = useRef(false);

  // Derive stats and eligibility
  const stats = useMemo(() => calculateStats(activities), [activities]);
  const eligibility = useMemo(() => calculateEligibility(activities, user.joiningDate), [activities, user.joiningDate]);

  // Sync with Cloud in background
  useEffect(() => {
    isMounted.current = true;
    fetchData(activities.length === 0); // Only show full loader if we have zero local history
    return () => { isMounted.current = false; };
  }, [internIdClean]);

  // Persistent Auto-Save: Whenever activities change, update the local vault
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
      
      if (isMounted.current) {
        setActivities(prev => {
          // Merge logic: Combine local and cloud, prioritizing unique entries
          const combined = [...prev, ...cloudData];
          const uniqueMap = new Map();
          
          combined.forEach(item => {
            const key = item.id || `${item.internId}_${item.date}`;
            // If we have a local version and a cloud version, prefer the one with a quality score
            if (!uniqueMap.has(key) || (item.qualityScore && !uniqueMap.get(key).qualityScore)) {
              uniqueMap.set(key, item);
            }
          });
          
          const unique = Array.from(uniqueMap.values());
          const sorted = unique.sort((a, b) => b.date.localeCompare(a.date));
          
          // Force save merged state immediately
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
          return sorted;
        });
      }
    } catch (err) {
      console.warn("Cloud Sync offline. Using local vault data.");
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
      const updated = [newAct, ...prev];
      const sorted = updated.sort((a, b) => b.date.localeCompare(a.date));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      return sorted;
    });
  };

  // Robust "Today" check using local date string to prevent early flip-over
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const hasSubmittedToday = useMemo(() => {
    return activities.some(a => a.date === todayStr);
  }, [activities, todayStr]);
  
  const firstLogDate = useMemo(() => {
    if (activities.length === 0) return null;
    const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[0].date;
  }, [activities]);

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Secure Archive...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Dashboard</h2>
          <p className="text-slate-500 font-semibold mt-1">
            <span className="text-blue-600">ID: {internIdClean}</span> — Connected as {user.name}
          </p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={() => fetchData(false)}
              disabled={syncing}
              className="px-6 py-3 bg-white border border-slate-200 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all flex items-center gap-3 shadow-sm active:scale-95"
            >
              <div className={`${syncing ? 'animate-spin' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              {syncing ? 'Refreshing...' : 'Cloud Sync'}
            </button>
            <div className="px-6 py-3 rounded-[20px] bg-slate-900 text-white flex items-center gap-3 shadow-xl shadow-slate-200">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {firstLogDate ? `Records: ${activities.length}` : "Status: Online"}
                </span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Days" value={stats.totalActiveDays} icon="📅" subText="Goal: 60 Days" />
        <StatCard title="Average Hours" value={`${stats.averageHours.toFixed(1)}h`} icon="⏰" subText="Target: ≥ 2.5h" />
        <StatCard title="Current Streak" value={`${stats.currentStreak}d`} icon="🔥" subText="Consistency" />
        <StatCard 
            title="Eligibility" 
            value={eligibility.isEligible ? "READY" : "PENDING"} 
            icon="🎓" 
            subText={eligibility.isEligible ? "Qualified" : "Working..."}
            accent={eligibility.isEligible ? "text-green-600" : "text-amber-500"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Submission Gate: Will NEVER appear twice if history is detected */}
          {!hasSubmittedToday ? (
            <SubmissionForm user={user} onSuccess={handleSubmissionSuccess} />
          ) : (
            <div className="bg-white border border-green-200 p-12 rounded-[48px] shadow-sm flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <div className="bg-green-600 p-8 rounded-[36px] text-white shadow-2xl shadow-green-200 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-3xl font-black text-slate-900 tracking-tight">Today is Certified</h4>
                <p className="text-slate-500 mt-2 font-bold text-base">Your activity for {new Date(todayStr).toLocaleDateString()} has been logged and locked.</p>
              </div>
              <div className="px-8 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Access Denied
              </div>
            </div>
          )}

          <div className="bg-white rounded-[48px] shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Verified Log History</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Authenticated Activity Chain</p>
              </div>
              <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em]">Safe Vault</span>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {activities.map((activity) => (
                <div key={activity.id} className="p-12 hover:bg-slate-50/50 transition-all group border-l-4 border-l-transparent hover:border-l-blue-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[24px] bg-slate-100 flex flex-col items-center justify-center text-slate-700 shadow-inner group-hover:bg-white group-hover:shadow-lg transition-all">
                        <span className="text-xl font-black">{new Date(activity.date).getDate()}</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter">{new Date(activity.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      </div>
                      <div>
                        <span className="text-xl font-black text-slate-900 block leading-tight">{new Date(activity.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-[11px] text-blue-600 font-black uppercase tracking-[0.3em] mt-1.5 block">{activity.category}</span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activity.hours >= 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {activity.hours >= 3 ? 'Duration: 3h+' : 'Duration: 2h'}
                      </span>
                      {activity.qualityScore && (
                        <span className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200/40">
                          AI Grade: {activity.qualityScore}/10
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 text-sm text-slate-600 leading-relaxed font-semibold shadow-sm group-hover:bg-white group-hover:border-blue-100 transition-all">
                    {activity.description}
                  </div>
                  {activity.proofLink && (
                    <a href={activity.proofLink} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-3 text-[11px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-[0.25em] group-hover:translate-x-3 transition-all">
                      Review Proof of Work
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  )}
                </div>
              ))}
              {activities.length === 0 && !syncing && (
                <div className="p-32 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-[48px] flex items-center justify-center mx-auto mb-10 text-slate-200">
                    <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">Archive Offline</h4>
                  <p className="text-slate-400 text-base mt-3 font-semibold">Start your internship by logging your first daily activity.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-12 rounded-[48px] shadow-sm border border-slate-200/60">
            <h3 className="font-black text-slate-900 mb-12 flex items-center gap-4 text-xs uppercase tracking-[0.3em]">
                Progress Metrics
            </h3>
            <div className="space-y-12">
               <ProgressBar label="Required Active Days" current={stats.totalActiveDays} target={60} />
               <ProgressBar label="Average Daily Effort" current={stats.averageHours} target={2.5} unit="h" />
               <div className="pt-12 border-t border-slate-100">
                  <p className="text-[11px] font-black text-slate-400 uppercase mb-8 tracking-[0.25em]">Compliance Status</p>
                  <ul className="space-y-6">
                    <CheckItem label="60 Unique Work Days" checked={stats.totalActiveDays >= 60} />
                    <CheckItem label="High Intensity (Avg ≥ 2.5h)" checked={stats.averageHours >= 2.5} />
                    <CheckItem label="No Gaps > 3 Consecutive Days" checked={eligibility.maxGapDays <= 3 && activities.length > 0} />
                  </ul>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 p-12 rounded-[48px] shadow-2xl text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 -mr-20 -mt-20 w-56 h-56 bg-blue-500/25 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
             <div className="relative z-10">
               <div className="w-16 h-16 bg-white/10 rounded-[28px] flex items-center justify-center mb-10 border border-white/10 shadow-inner">
                 <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                   <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                 </svg>
               </div>
               <h4 className="font-black text-2xl mb-4 tracking-tight">Support Node</h4>
               <p className="text-slate-400 text-sm leading-relaxed mb-10 font-bold opacity-80">Sync with our internal Slack community for live feedback and mentorship.</p>
               <button className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest transition-all hover:bg-blue-500 active:scale-95 shadow-2xl shadow-blue-500/20">Access Workspace</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, subText, accent }: any) => (
  <div className="bg-white p-12 rounded-[48px] shadow-sm border border-slate-200/60 hover:border-blue-400 transition-all group hover:shadow-2xl hover:shadow-blue-500/5">
    <div className="flex justify-between items-start mb-10">
      <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-3xl group-hover:bg-blue-50 transition-colors shadow-inner border border-slate-100">{icon}</div>
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
            <div className="flex justify-between text-[12px] font-black uppercase tracking-widest">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-900">{current.toFixed(1)}{unit} / {target}{unit}</span>
            </div>
            <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1.5">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-green-500 shadow-lg shadow-green-100' : 'bg-slate-900 shadow-xl'}`} 
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

const CheckItem = ({ label, checked }: any) => (
    <li className="flex items-center gap-5 text-[11px] font-black uppercase tracking-[0.2em]">
        {checked ? (
            <div className="w-7 h-7 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-100">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            </div>
        ) : (
            <div className="w-7 h-7 border-2 border-slate-200 rounded-2xl shadow-inner bg-slate-100" />
        )}
        <span className={checked ? 'text-slate-900' : 'text-slate-400 opacity-60'}>{label}</span>
    </li>
);

export default InternDashboard;
