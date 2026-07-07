import { User } from '../types';
import { User as UserIcon, Shield, ShieldX, ScrollText, Database, Download, LogOut, Crown } from 'lucide-react';
import { useState } from 'react';

interface SettingsViewProps {
  user: User;
  onLogout: () => void;
}

export default function SettingsView({ user, onLogout }: SettingsViewProps) {
  const [consents, setConsents] = useState([
    { id: '1', type: 'Document Processing & AI Extraction', date: '2024-03-01 10:23 AM', revoked: false },
    { id: '2', type: 'Financial Data Aggregation', date: '2024-03-01 10:25 AM', revoked: true },
  ]);

  const handleRevoke = (id: string) => {
    if (confirm("Are you sure you want to revoke this consent? Features relying on it will stop working.")) {
      setConsents(prev => prev.map(c => c.id === id ? { ...c, revoked: true } : c));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-8 lg:px-12 max-w-5xl mx-auto w-full">
        
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-carbon mb-2">Settings</h1>
          <p className="text-stone">Manage your profile, privacy, and data.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4 space-y-6">
            <div className="bg-carbon text-canvas rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/20 rounded-full blur-[40px]" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center mb-4 shadow-lg shadow-saffron/20">
                  <span className="text-3xl font-bold text-white">{user.name.charAt(0)}</span>
                </div>
                <h2 className="text-xl font-semibold mb-1">{user.name}</h2>
                <div className="flex items-center gap-2 text-stone">
                  <UserIcon className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.role === 'admin' && (
                  <div className="mt-4 px-3 py-1 bg-saffron/20 border border-saffron/30 text-saffron-light text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" /> Admin
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#faf5ef] rounded-3xl p-6 border border-[#f0e6d5]">
              <div className="flex items-center gap-2 mb-6">
                <Database className="w-5 h-5 text-saffron" />
                <h3 className="font-semibold text-[#4a3f35]">Data Controls</h3>
              </div>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-stone/10 hover:border-saffron/30 transition-colors group">
                  <span className="text-sm font-medium text-carbon">Export My Data</span>
                  <Download className="w-4 h-4 text-stone group-hover:text-saffron transition-colors" />
                </button>
                <button onClick={onLogout} className="w-full flex items-center justify-between p-3 rounded-xl bg-crimson/5 border border-crimson/10 hover:bg-crimson/10 transition-colors text-crimson group">
                  <span className="text-sm font-medium">Logout</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-8">
            
            {/* Consent History */}
            <div className="bg-white rounded-3xl p-6 border border-stone/10 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-carbon" />
                <h3 className="font-semibold text-carbon text-lg">Consent History</h3>
              </div>
              <div className="space-y-4">
                {consents.length === 0 ? (
                  <p className="text-sm text-stone py-4">No consent events.</p>
                ) : (
                  consents.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-stone/10 bg-stone/5">
                      <div>
                        <p className="font-medium text-carbon text-sm mb-1">{c.type}</p>
                        <p className="text-xs text-stone">{c.date}</p>
                      </div>
                      {c.revoked ? (
                        <span className="px-3 py-1 rounded-full bg-stone/20 text-stone text-xs font-semibold uppercase tracking-wider">Revoked</span>
                      ) : (
                        <button 
                          onClick={() => handleRevoke(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-crimson hover:bg-crimson/10 transition-colors text-xs font-medium"
                        >
                          <ShieldX className="w-4 h-4" /> Revoke
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Audit Log */}
            <div className="bg-white rounded-3xl p-6 border border-stone/10 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <ScrollText className="w-5 h-5 text-carbon" />
                <h3 className="font-semibold text-carbon text-lg">Audit Log</h3>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                {[
                  { action: 'Generated Tax Report', time: 'Just now' },
                  { action: 'Updated Tax Profile', time: '2 mins ago' },
                  { action: 'Deleted hdfc_statement_nov.csv', time: '1 hour ago' },
                  { action: 'Verified 14 extracted fields', time: '1 hour ago' },
                  { action: 'Uploaded salary_slip_nov.pdf', time: '2 hours ago' },
                  { action: 'Logged in from Mac OS / Chrome', time: '2 hours ago' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-stone/5 last:border-0">
                    <span className="text-sm text-carbon font-medium">{log.action}</span>
                    <span className="text-xs text-stone">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
