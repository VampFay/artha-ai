/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ViewState, User } from './types';
import LoginScreen from './views/LoginScreen';
import AppShell from './components/AppShell';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [hasConsented, setHasConsented] = useState<boolean>(true);
  
  // For demo: auto-login
  useEffect(() => {
    // setUser({ id: '1', name: 'Demo User', email: 'test@vantage.ai', role: 'user' });
  }, []);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <AppShell 
      user={user} 
      currentView={currentView} 
      onNavigate={setCurrentView}
      onLogout={() => setUser(null)}
    />
  );
}
