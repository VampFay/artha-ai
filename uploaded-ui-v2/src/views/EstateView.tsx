import { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Users, Shield, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function EstateView() {
  const [activeTab, setActiveTab] = useState<'nominees' | 'wills'>('nominees');

  const NOMINEES = [
    { name: 'Sarah Connor', relation: 'Spouse', allocation: '100%', status: 'Verified', assets: ['All Bank Accounts', 'Primary Residence', 'Term Life Insurance'] },
    { name: 'John Connor', relation: 'Child', allocation: 'Contingent', status: 'Pending Verification', assets: ['Trust Fund (Age 25)'] },
  ];

  return (
    <div className="flex flex-col min-h-full px-6 lg:px-12 pb-12 max-w-[1200px] mx-auto w-full">
      <div className="py-12 md:py-20 border-b border-carbon/10 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Estate & Succession</span>
        </motion.div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-carbon mb-2">
              Estate Planning
            </h1>
            <p className="text-sm text-stone max-w-xl">
              Secure your legacy. Manage your nominees, wills, and succession planning to ensure a smooth transition of your wealth.
            </p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('nominees')}
              className={cn(
                "text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors",
                activeTab === 'nominees' ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon"
              )}
            >
              Nominees
            </button>
            <button 
              onClick={() => setActiveTab('wills')}
              className={cn(
                "text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors",
                activeTab === 'wills' ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon"
              )}
            >
              Wills & Trusts
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'nominees' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-12"
        >
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase">Registered Nominees</h3>
              <button className="text-xs text-saffron font-medium hover:text-carbon transition-colors flex items-center gap-1">
                + Add Nominee
              </button>
            </div>
            
            {NOMINEES.map((nominee, i) => (
              <div key={i} className="p-6 border border-carbon/10 bg-[#FAFAFA] group hover:border-carbon/30 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-carbon/5 flex items-center justify-center">
                      <Users className="w-5 h-5 text-carbon" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-carbon">{nominee.name}</h4>
                      <p className="text-xs text-stone">{nominee.relation}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold tracking-wider uppercase",
                    nominee.status === 'Verified' ? "text-green-600" : "text-saffron"
                  )}>{nominee.status}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4 pb-4 border-b border-carbon/5">
                  <div>
                    <span className="block text-[10px] text-stone uppercase tracking-wider mb-1">Allocation</span>
                    <span className="font-mono text-carbon">{nominee.allocation}</span>
                  </div>
                </div>
                
                <div>
                  <span className="block text-[10px] text-stone uppercase tracking-wider mb-2">Assigned Assets</span>
                  <div className="flex flex-wrap gap-2">
                    {nominee.assets.map((asset, j) => (
                      <span key={j} className="text-xs bg-carbon/5 text-carbon px-2 py-1 rounded-sm">
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-6">
            <div className="p-8 bg-carbon text-white">
              <Shield className="w-8 h-8 text-saffron mb-6" />
              <h3 className="text-sm font-medium text-white mb-2">Audit Status</h3>
              <p className="text-xs text-stone-light leading-relaxed mb-6">
                Your portfolio has 2 unassigned assets without clear nominees. It is highly recommended to update them to avoid probate issues.
              </p>
              <button className="w-full py-3 bg-white text-carbon text-xs font-medium hover:bg-saffron hover:text-white transition-colors">
                Run Full Audit
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <FileText className="w-12 h-12 text-stone-light mb-6" />
          <h2 className="text-xl font-medium text-carbon mb-2">No Registered Wills</h2>
          <p className="text-sm text-stone max-w-md mb-8">
            You haven't uploaded any legally binding wills or trust documents yet. Secure your succession plan today.
          </p>
          <button className="px-6 py-3 border border-carbon text-xs font-medium hover:bg-carbon hover:text-white transition-colors">
            Upload Document
          </button>
        </motion.div>
      )}
    </div>
  );
}
