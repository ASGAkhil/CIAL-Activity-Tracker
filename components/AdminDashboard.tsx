
import React, { useState, useEffect } from 'react';
import { User, Activity, EligibilityResult } from '../types';
import { api } from '../services/apiService';
import { calculateEligibility, calculateStats, formatCSV } from '../utils/logic';
import { CONFIG } from '../services/config';

const AdminDashboard: React.FC = () => {
  const [interns, setInterns] = useState<User[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [u, a] = await Promise.all([api.getAllInterns(), api.getActivities()]);
        setInterns(u);
        setAllActivities(a);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getInternStats = (internId: string) => {
    const acts = allActivities.filter(a => a.internId === internId);
    return {
        stats: calculateStats(acts),
        eligibility: calculateEligibility(acts, '2024-05-01')
    };
  };

  const filteredInterns = interns.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.internId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const exportData = interns.map(i => {
        const { stats, eligibility } = getInternStats(i.internId);
        return {
            ID: i.internId,
            Name: i.name,
            Email: i.email,
            ActiveDays: stats.totalActiveDays,
            AvgHours: stats.averageHours.toFixed(1),
            MaxGap: eligibility.maxGapDays,
            Status: eligibility.isEligible ? 'Eligible' : 'Pending'
        };
    });
    const csvContent = formatCSV(exportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `intern_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-center">Syncing with Data Source...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Program Management</h2>
          <div className="flex items-center gap-2 mt-1">
             <div className={`w-2 h-2 rounded-full ${CONFIG.GOOGLE_SHEET_API_URL ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`}></div>
             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Source: {CONFIG.GOOGLE_SHEET_API_URL ? 'Google Sheets Live' : 'Internal Mock Dataset'}
             </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Data (CSV)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Interns</p>
            <p className="text-2xl font-black text-slate-900">{interns.length}</p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Today</p>
            <p className="text-2xl font-black text-blue-600">{allActivities.filter(a => a.date === new Date().toISOString().split('T')[0]).length}</p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cert. Eligible</p>
            <p className="text-2xl font-black text-green-600">
                {interns.filter(i => getInternStats(i.internId).eligibility.isEligible).length}
            </p>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </span>
             <input 
               type="text" 
               className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
               placeholder="Search by name or ID..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase">Showing {filteredInterns.length} Interns</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Intern Info</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metrics</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Compliance</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredInterns.map((intern) => {
                const { stats, eligibility } = getInternStats(intern.internId);
                const progress = Math.min((stats.totalActiveDays / CONFIG.PROGRAM_SETTINGS.MIN_DAYS_FOR_CERTIFICATE) * 100, 100);
                
                return (
                  <tr key={intern.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{intern.name}</div>
                      <div className="text-xs text-slate-500">{intern.internId} • {intern.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${eligibility.isEligible ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{stats.totalActiveDays} / {CONFIG.PROGRAM_SETTINGS.MIN_DAYS_FOR_CERTIFICATE} Days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-900">{stats.averageHours.toFixed(2)}h/day avg</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Consistency: {(100 - (eligibility.maxGapDays * 10)).toFixed(0)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className={`text-xs font-bold ${eligibility.maxGapDays > CONFIG.PROGRAM_SETTINGS.MAX_ALLOWED_GAP_DAYS ? 'text-red-500' : 'text-slate-900'}`}>
                          Max Gap: {eligibility.maxGapDays} days
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${eligibility.isEligible ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {eligibility.isEligible ? 'Eligible' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredInterns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No interns found matching that search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
