
import React, { useState, useRef } from 'react';
import { ActivityCategory, User, Activity } from '../types';
import { api } from '../services/apiService';

interface SubmissionFormProps {
  user: User;
  onSuccess: (newActivity: Activity) => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proofMode, setProofMode] = useState<'image' | 'url'>('image');
  const [formData, setFormData] = useState({
    hours: 3,
    category: ActivityCategory.LEARNING,
    description: '',
    proof: '' // Can be URL or Base64 Image
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get local date in YYYY-MM-DD format
  const todayStr = new Date().toLocaleDateString('en-CA');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit for safety
        setError('Image size too large. Please use an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, proof: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearProof = () => {
    setFormData({ ...formData, proof: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
        proofLink: formData.proof // proofLink field used to store both
      });
      onSuccess(activity);
      setFormData({ hours: 3, category: ActivityCategory.LEARNING, description: '', proof: '' });
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

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Proof of Work (Optional)</label>
          
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            <button 
              type="button"
              onClick={() => { setProofMode('image'); clearProof(); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${proofMode === 'image' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Attachment
            </button>
            <button 
              type="button"
              onClick={() => { setProofMode('url'); clearProof(); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${proofMode === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4.493 4.493 0 013.537-3.536m3.636 3.636L15.914 13.51a5 5 0 01-7.071 0" />
              </svg>
              URL Link
            </button>
          </div>

          <div className="relative">
            {proofMode === 'image' ? (
              <div className="space-y-4">
                {!formData.proof ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl py-10 px-6 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all group"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm mb-4 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Select Image from Gallery</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                  </button>
                ) : (
                  <div className="relative group">
                    <img 
                      src={formData.proof} 
                      alt="Proof Preview" 
                      className="w-full h-48 object-cover rounded-3xl border border-slate-200 shadow-inner" 
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center gap-4">
                      <button 
                        type="button" 
                        onClick={clearProof}
                        className="p-3 bg-red-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <input 
                  type="url"
                  className="w-full px-12 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-blue-600 bg-slate-50 placeholder:font-normal placeholder:text-slate-300"
                  placeholder="https://github.com/cial-cloud/..."
                  value={formData.proof}
                  onChange={(e) => setFormData({...formData, proof: e.target.value})}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.828a4.493 4.493 0 013.537-3.536m3.636 3.636L15.914 13.51a5 5 0 01-7.071 0" />
                   </svg>
                </div>
              </div>
            )}
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
