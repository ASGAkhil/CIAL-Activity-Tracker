
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import InternDashboard from './components/InternDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Amplify } from 'aws-amplify';

// In a real Gen 2 environment, this file is generated during deployment
// but we wrap the config call to prevent errors during build
try {
  // @ts-ignore
  import('./amplify_outputs.json').then((outputs) => {
    Amplify.configure(outputs.default);
  }).catch(() => {
    console.log("Amplify outputs not found - proceeding with standalone mode.");
  });
} catch (e) {}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session expiration check (Daily)
    const storedUser = localStorage.getItem('intern_session_user');
    const storedTimestamp = localStorage.getItem('intern_session_timestamp');

    if (storedUser && storedTimestamp) {
      const loginDate = new Date(parseInt(storedTimestamp)).toDateString();
      const today = new Date().toDateString();
      
      if (loginDate === today) {
        setUser(JSON.parse(storedUser));
      } else {
        localStorage.removeItem('intern_session_user');
        localStorage.removeItem('intern_session_timestamp');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('intern_session_user', JSON.stringify(userData));
    localStorage.setItem('intern_session_timestamp', Date.now().toString());
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('intern_session_user');
    localStorage.removeItem('intern_session_timestamp');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      {user.role === UserRole.ADMIN ? (
        <AdminDashboard />
      ) : (
        <InternDashboard user={user} />
      )}
    </Layout>
  );
};

export default App;
