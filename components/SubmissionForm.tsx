
import React, { useState } from 'react';
import { ActivityCategory, User, Activity } from '../types';
import { api } from '../services/apiService';

interface SubmissionFormProps {
  user: User;
  onSuccess: (newActivity: Activity) => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    hours: 3,
    category: ActivityCategory.LEARNING,
    description: '',
    proofLink: ''
  });

  // Get local date in YYYY-MM-DD format
  const todayStr = new Date().toLocaleDateString('en-CA');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.description.trim().length < 50) {
      setError('Description must be at least 50 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const activity = await api.submitActivity({
        internId: user.internId.trim().toUpperCase(),
        date: todayStr,
        hours: formData.hours,
        category: formData.category,
        description: formData.description,
        proofLink: formData.proofLink
      });
      onSuccess(activity);
      setFormData({ hours: 3, category: ActivityCategory.LEARNING, description: '', proofLink: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit activity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Log Daily Milestone</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Date: {new Date(todayStr).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-100">
          Official Entry
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Working Duration</label>
            <select 
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-slate-900 appearance-none bg-slate-50"
              value={formData.hours}
              onChange={(e) => setFormData({...formData, hours: parseInt(e.target.value)})}
            >
              <option value={2}>2 Hours (Minimal)</option>
              <option value={3}>3+ Hours (Standard)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Work Classification</label>
            <select 
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-slate-900 appearance-none bg-slate-50"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value as ActivityCategory})}
            >
              {Object.values(ActivityCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Achievement Summary (Min 50 Chars)</label>
          <textarea 
            required
            className="w-full px-6 py-5 rounded-[24px] border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 h-40 resize-none transition-all font-medium text-slate-800 placeholder:text-slate-300 bg-slate-50"
            placeholder="Detail your primary tasks, obstacles cleared, and specific learning outcomes from today's session..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <div className="flex justify-between mt-3 px-1">
            <span className={`text-[9px] font-black uppercase tracking-widest ${formData.description.length < 50 ? 'text-amber-500' : 'text-green-500'}`}>
                Intensity: {formData.description.length} / 50 characters
            </span>
            {formData.description.length >= 50 && (
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Description Validated</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Evidence / Proof URL (Optional)</label>
          <div className="relative">
            <input 
              type="url"
              className="w-full px-12 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-blue-600 bg-slate-50 placeholder:font-normal placeholder:text-slate-300"
              placeholder="https://github.com/cial-cloud/..."
              value={formData.proofLink}
              onChange={(e) => setFormData({...formData, proofLink: e.target.value})}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4.493 4.493 0 013.537-3.536m3.636 3.636L15.914 13.51a5 5 0 01-7.071 0" />
               </svg>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-red-100 animate-shake">
            Error: {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || formData.description.length < 50}
          className={`w-full py-5 rounded-[24px] font-black text-xs text-white transition-all uppercase tracking-[0.3em] shadow-xl ${loading || formData.description.length < 50 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-blue-600 hover:shadow-blue-500/20 active:scale-95'}`}
        >
          {loading ? 'Transmitting Data...' : 'Submit Official Record'}
        </button>
      </form>
    </div>
  );
};

export default SubmissionForm;
