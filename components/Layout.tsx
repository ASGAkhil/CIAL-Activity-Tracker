
import React from 'react';
import { User, UserRole } from '../types';
import { BrandLogo } from './Logo';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-auto">
                <BrandLogo size="sm" className="h-full w-auto" />
              </div>
              <div className="h-8 w-[1px] bg-slate-100 mx-1"></div>
              <div>
                <span className="font-black text-2xl tracking-tighter text-slate-900 block leading-none">CIAL</span>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mt-1">Intern-Tracker</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">{user.internId} • {user.role}</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-100 hidden md:block"></div>
              <button 
                onClick={onLogout}
                className="group flex items-center gap-2.5 text-[11px] font-black text-slate-500 hover:text-red-600 transition-all uppercase tracking-[0.2em]"
              >
                Sign Out
                <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20 text-left">
            {/* Column 1: Brand & Bio */}
            <div className="space-y-8">
              <h4 className="text-xl font-bold text-slate-900">Cloud AI Labs</h4>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                Cloud-native IT consulting and education NGO with a PAN-India presence, specializing in Cloud Pre-Sales, Project Delivery, and AI-driven solutions.
              </p>
              <div className="flex gap-4">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="mailto:akhil@cloudailabs.in" className="w-11 h-11 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 hover:bg-sky-500 hover:text-white transition-all shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Links */}
            <div>
              <h4 className="text-xl font-bold text-slate-900 mb-8">Quick Links</h4>
              <ul className="space-y-5">
                <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">Home</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">Internship Program</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">Our Services</a></li>
                <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">Request a Quote</a></li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h4 className="text-xl font-bold text-slate-900 mb-8">Contact Us</h4>
              <ul className="space-y-6">
                <li className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-blue-500 shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  PAN-India Presence
                </li>
                <li className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-blue-500 shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  akhil@cloudailabs.in
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-xs font-semibold tracking-wide">
              © 2026 Cloud AI Labs. All rights reserved. (NGO Reg. in process)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
