
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { api } from '../services/apiService';
import { BrandLogo } from './Logo';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [nameQuery, setNameQuery] = useState('');
  const [internId, setInternId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  
  const [directory, setDirectory] = useState<{ name: string; id: string }[]>([]);
  const [filteredNames, setFilteredNames] = useState<{ name: string; id: string }[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDirectory = async () => {
      setSyncing(true);
      try {
        const data = await api.getInternDirectory();
        setDirectory(data);
      } catch (err) {
        console.error("Directory sync failed", err);
      } finally {
        setSyncing(false);
      }
    };
    fetchDirectory();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setNameQuery(query);
    if (query.length > 0) {
      const filtered = directory.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);
      setFilteredNames(filtered);
      setIsDropdownOpen(true);
    } else {
      setFilteredNames([]);
      setIsDropdownOpen(false);
    }
  };

  const selectName = (item: { name: string; id: string }) => {
    setNameQuery(item.name);
    setInternId(''); 
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api.loginByName(nameQuery.trim(), internId.trim());
      if (user) {
        onLogin(user);
      } else {
        setError('Verification failed. The ID provided does not match the selected intern.');
      }
    } catch (err) {
      setError('Connection error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-100/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/30 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <BrandLogo size="lg" className="mb-8" />
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
            Activity Tracker
          </h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-3">
            Official Intern Portal
          </p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Registered Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  autoComplete="off"
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300 placeholder:font-normal"
                  placeholder="Start typing your name..."
                  value={nameQuery}
                  onChange={handleNameChange}
                  onFocus={() => nameQuery && setIsDropdownOpen(true)}
                />
              </div>

              {isDropdownOpen && filteredNames.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto ring-1 ring-slate-200/50">
                  {filteredNames.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-5 py-4 hover:bg-blue-50/50 transition-colors border-b border-slate-50 last:border-0"
                      onClick={() => selectName(item)}
                    >
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-[9px] text-blue-500 uppercase font-black tracking-widest mt-0.5">Verified Profile</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Verify Intern ID</label>
              <input 
                type="text" 
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-slate-900 font-mono font-black uppercase tracking-widest placeholder:text-slate-300 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal"
                placeholder="INT-XXXX"
                value={internId}
                onChange={(e) => setInternId(e.target.value.toUpperCase())}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[11px] font-bold uppercase tracking-tight">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || syncing || !nameQuery || !internId}
              className={`w-full py-4 px-8 rounded-2xl font-black text-xs text-white transition-all uppercase tracking-widest ${loading || syncing || !nameQuery || !internId ? 'bg-slate-200 cursor-not-allowed text-slate-400' : 'bg-slate-900 hover:bg-blue-600 active:scale-[0.98] shadow-lg shadow-slate-200'}`}
            >
              {loading ? 'Verifying...' : 'Validate & Enter'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-center">
            <button 
              type="button" 
              onClick={() => { setNameQuery('Program Director'); setInternId('ADM-001'); }}
              className="text-[9px] font-black text-slate-300 hover:text-blue-500 transition-colors uppercase tracking-[0.25em]"
            >
              Administrative Access
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
          © 2026 CloudAiLabs • PRIVACY SECURED
        </p>
      </div>
    </div>
  );
};

export default Login;
