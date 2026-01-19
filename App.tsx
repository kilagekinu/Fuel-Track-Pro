
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Tank, Meter, FuelType, Reconciliation, UserRole, User, 
  AuditLog, ReconciliationVersion 
} from './types';
import { INITIAL_TANKS, INITIAL_METERS } from './constants';
import StockVisualizer from './components/StockVisualizer';
import DashboardCard from './components/DashboardCard';
import { exportToCSV, generateTelegramPayload } from './services/exportService';
import { generateSampleDay } from './services/testDataService';
import { getReconciliationInsights } from './services/geminiService';

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'James (Operator)', role: UserRole.OPERATOR },
  { id: 'u2', name: 'Sarah (Controller)', role: UserRole.STOCK_CONTROLLER },
  { id: 'u3', name: 'David (Supervisor)', role: UserRole.SUPERVISOR },
  { id: 'u4', name: 'Admin Node', role: UserRole.ADMIN },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[2]); 
  const [tanks] = useState<Tank[]>(INITIAL_TANKS);
  const [meters] = useState<Meter[]>(INITIAL_METERS);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');

  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ops' | 'audit' | 'reports' | 'integration'>('dashboard');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  
  // Form State - Split into Opening and Closing to support explicit entry
  const [shiftOpeningReadings, setShiftOpeningReadings] = useState<Record<string, number>>({});
  const [shiftClosingReadings, setShiftClosingReadings] = useState<Record<string, number>>({});
  const [shiftDips, setShiftDips] = useState<Record<string, number>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Pre-populate opening readings from master data on load
  useEffect(() => {
    const openings: Record<string, number> = {};
    meters.forEach(m => {
      openings[m.id] = m.lastReading;
    });
    setShiftOpeningReadings(openings);
  }, [meters]);

  const prices = { [FuelType.ADO]: 1.85, [FuelType.ULP]: 1.92, [FuelType.ZOOM]: 2.10 };

  const copyToClipboard = (recon: Reconciliation) => {
    const payload = generateTelegramPayload(recon);
    navigator.clipboard.writeText(payload).then(() => {
      alert("Summary copied to clipboard!");
    });
  };

  const recordAudit = (action: string, details: string) => {
    const log: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      userId: currentUser.id,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const seedTestData = () => {
    const data = generateSampleDay(currentUser.id);
    setReconciliations(prev => [...data, ...prev]);
    recordAudit("SYS_SEED", "Generated full operational day for testing.");
    setActiveTab('reports');
  };

  const handleAiAnalysis = async () => {
    if (reconciliations.length === 0) return;
    setAiInsights('Analyzing trends...');
    const result = await getReconciliationInsights(reconciliations.slice(0, 3));
    setAiInsights(result);
  };

  const validateStep = (step: number) => {
    const errors: string[] = [];
    if (step === 1) {
      meters.forEach(m => {
        const open = shiftOpeningReadings[m.id];
        const close = shiftClosingReadings[m.id];
        if (open === undefined || isNaN(open)) errors.push(`${m.name} opening reading required.`);
        if (close === undefined || isNaN(close)) errors.push(`${m.name} closing reading required.`);
        else if (close < open) errors.push(`${m.name} reading regression detected on ${m.name}.`);
      });
    }
    if (step === 2) {
      tanks.forEach(t => {
        if (!shiftDips[t.id]) errors.push(`${t.name} physical dip volume required.`);
      });
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCommit = () => {
    const timestamp = new Date().toISOString();
    const newRecons: Reconciliation[] = Object.values(FuelType).map(fuel => {
      const fuelTanks = tanks.filter(t => t.fuelType === fuel);
      const fuelMeters = meters.filter(m => {
          // Logic to link meters to fuel types based on naming/ID convention
          if (fuel === FuelType.ADO) return m.id.includes('ado') || m.type === 'GANTRY' || m.id.includes('drum');
          return m.id.toLowerCase().includes(fuel.toLowerCase());
      });
      const opening = fuelTanks.reduce((acc, t) => acc + t.currentVolume, 0);
      const closing = fuelTanks.reduce((acc, t) => acc + (shiftDips[t.id] || 0), 0);
      
      const metered = fuelMeters.reduce((acc, m) => {
        const mOpen = shiftOpeningReadings[m.id] || 0;
        const mClose = shiftClosingReadings[m.id] || mOpen;
        return acc + (mClose - mOpen);
      }, 0);

      return {
        id: `rc-${fuel}-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        fuelType: fuel,
        openingStock: opening,
        receipts: 0,
        transfers: 0,
        calculatedSales: metered,
        actualDips: closing,
        variance: (opening - closing) - metered,
        revenue: metered * prices[fuel],
        isLocked: false,
        status: 'PENDING',
        operatorId: currentUser.id,
        timestamp,
        version: 1,
        versionHistory: []
      };
    });
    setReconciliations(prev => [...newRecons, ...prev]);
    recordAudit("SHIFT_COMMIT", "Operational data committed to ledger.");
    setActiveTab('reports');
    setWizardStep(1);
    setShiftClosingReadings({});
    setShiftDips({});
  };

  const dailyStats = useMemo(() => {
    return reconciliations.reduce((acc, r) => ({
      vol: acc.vol + r.calculatedSales,
      rev: acc.rev + r.revenue,
      var: acc.var + r.variance
    }), { vol: 0, rev: 0, var: 0 });
  }, [reconciliations]);

  const gantryMeters = meters.filter(m => m.type === 'GANTRY');
  const otherMeters = meters.filter(m => m.type !== 'GANTRY');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t md:w-64 md:h-screen md:border-r md:border-t-0 z-50 flex flex-col shadow-2xl md:shadow-none">
        <div className="p-8 hidden md:block">
          <h1 className="text-xl font-black tracking-tighter italic">FUELTRACK<span className="text-blue-600 not-italic">PRO</span></h1>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">v4.2 Enterprise</p>
        </div>
        <div className="flex md:flex-col p-2 md:p-4 gap-1 flex-grow overflow-x-auto">
          {[
            { id: 'dashboard', icon: '🏠', label: 'Home' },
            { id: 'ops', icon: '⚡', label: 'Shift' },
            { id: 'reports', icon: '📊', label: 'Archive' },
            { id: 'integration', icon: '🔌', label: 'Sync' },
            { id: 'audit', icon: '🛡️', label: 'Audit' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center gap-1 md:gap-3 p-3 md:p-4 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[9px] md:text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="md:ml-64 p-4 md:p-10 w-full pb-32">
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-center">
               <h2 className="text-4xl font-black tracking-tight">Daily Pulse</h2>
               <div className="flex gap-2">
                 <button onClick={handleAiAnalysis} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">Get AI Insights</button>
               </div>
            </header>

            {aiInsights && (
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] text-sm text-blue-900 leading-relaxed font-medium">
                <span className="font-black uppercase text-[10px] block mb-2 tracking-widest">Gemini Engine Analysis</span>
                {aiInsights}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <DashboardCard title="Revenue (Daily)" value={`$${(dailyStats.rev).toLocaleString()}`} icon="💰" />
              <DashboardCard title="Net Variance" value={`${dailyStats.var.toFixed(1)} L`} icon="⚖️" trend={{ value: 0.8, positive: dailyStats.var >= 0 }} />
              <DashboardCard title="Compliance" value="98.2%" icon="✅" />
            </div>

            <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
              <h3 className="font-black text-xl mb-10 flex items-center gap-3"><span className="w-2 h-8 bg-blue-600 rounded-full"></span> Live Stock Balance</h3>
              <StockVisualizer tanks={tanks} />
            </div>
          </div>
        )}

        {activeTab === 'ops' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between px-10 relative max-w-xl mx-auto">
               <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-100 -z-0"></div>
               {[1, 2, 3].map(s => (
                 <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-black z-10 transition-all border-4 ${wizardStep === s ? 'bg-blue-600 text-white border-blue-100 scale-125' : wizardStep > s ? 'bg-emerald-500 text-white border-emerald-50' : 'bg-white text-slate-200 border-slate-50'}`}>{wizardStep > s ? '✓' : s}</div>
               ))}
            </div>

            <div className="bg-white p-6 md:p-12 rounded-[3.5rem] border shadow-2xl shadow-slate-200/50">
              {validationErrors.length > 0 && (
                <div className="mb-10 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] text-xs font-bold text-rose-600">
                  <p className="uppercase tracking-widest font-black mb-2 opacity-50">Validation Failure</p>
                  {validationErrors.map((e, i) => <p key={i}>• {e}</p>)}
                </div>
              )}

              {wizardStep === 1 && (
                <div className="space-y-12">
                  <header>
                    <h3 className="text-3xl font-black">Fuel Outflow</h3>
                    <p className="text-slate-400 text-sm font-medium">Capture meter movements to reconcile against physical storage.</p>
                  </header>

                  {/* GANTRY OPERATIONS SECTION */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg"><span className="text-blue-700 text-xs font-black uppercase tracking-widest">Gantry Operations</span></div>
                      <div className="h-px flex-grow bg-slate-100"></div>
                    </div>
                    {gantryMeters.map(m => {
                      const open = shiftOpeningReadings[m.id] || 0;
                      const close = shiftClosingReadings[m.id] || 0;
                      const volume = close > open ? close - open : 0;
                      return (
                        <div key={m.id} className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2.5rem] space-y-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">High-Throughput Gantry</p>
                              <p className="font-black text-xl text-slate-800">{m.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-blue-400 uppercase">Calculated Outflow</p>
                              <p className="text-3xl font-black text-blue-600">{volume.toLocaleString()} L</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Opening Meter</label>
                              <input 
                                type="number" 
                                value={shiftOpeningReadings[m.id] || ''}
                                onChange={e => setShiftOpeningReadings({...shiftOpeningReadings, [m.id]: Number(e.target.value)})}
                                className="w-full bg-white border-2 border-slate-100 p-5 rounded-2xl font-black text-lg text-slate-700 focus:border-blue-400 outline-none transition-all shadow-sm"
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-3">Closing Meter</label>
                              <input 
                                type="number" 
                                value={shiftClosingReadings[m.id] || ''}
                                onChange={e => setShiftClosingReadings({...shiftClosingReadings, [m.id]: Number(e.target.value)})}
                                className="w-full bg-white border-2 border-blue-200 p-5 rounded-2xl font-black text-lg text-blue-700 focus:border-blue-500 outline-none transition-all shadow-sm"
                                placeholder="Enter final reading"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </section>

                  {/* STANDARD PUMPS & DRUMS SECTION */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg"><span className="text-slate-500 text-xs font-black uppercase tracking-widest">Pumps & Filling Points</span></div>
                      <div className="h-px flex-grow bg-slate-100"></div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {otherMeters.map(m => {
                        const open = shiftOpeningReadings[m.id] || 0;
                        const close = shiftClosingReadings[m.id] || 0;
                        const volume = close > open ? close - open : 0;
                        return (
                          <div key={m.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col md:flex-row md:items-center gap-6">
                            <div className="md:w-1/3">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{m.type}</p>
                              <p className="font-black text-slate-700">{m.name}</p>
                            </div>
                            <div className="flex flex-grow items-center gap-4">
                              <div className="w-1/2">
                                <input 
                                  type="number" 
                                  value={shiftOpeningReadings[m.id] || ''}
                                  onChange={e => setShiftOpeningReadings({...shiftOpeningReadings, [m.id]: Number(e.target.value)})}
                                  className="w-full bg-white border border-slate-200 p-4 rounded-xl text-xs font-bold text-slate-400"
                                  placeholder="Opening"
                                />
                              </div>
                              <div className="w-1/2 relative">
                                <input 
                                  type="number" 
                                  value={shiftClosingReadings[m.id] || ''}
                                  onChange={e => setShiftClosingReadings({...shiftClosingReadings, [m.id]: Number(e.target.value)})}
                                  className="w-full bg-white border-2 border-slate-200 p-4 rounded-xl text-right font-black focus:border-blue-500 outline-none transition-all"
                                  placeholder="Closing"
                                />
                                {volume > 0 && (
                                  <div className="absolute -top-3 right-3 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full">+{volume} L</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                  
                  <button onClick={() => validateStep(1) && setWizardStep(2)} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">Confirm Readings & Proceed</button>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-10">
                  <header>
                    <h3 className="text-3xl font-black">Storage Dips</h3>
                    <p className="text-slate-400 text-sm font-medium">Record physical dip levels for mass-balance verification.</p>
                  </header>
                  <div className="space-y-6">
                    {tanks.map(t => (
                      <div key={t.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
                        <div className="md:w-1/3 text-center md:text-left">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{t.fuelType} Storage</p>
                          <p className="font-black text-xl">{t.name}</p>
                        </div>
                        <div className="flex-grow w-full">
                          <input 
                            type="number" 
                            onChange={e => setShiftDips({...shiftDips, [t.id]: Number(e.target.value)})} 
                            className="w-full p-8 bg-white border-2 border-slate-100 rounded-[2rem] text-center font-black text-4xl text-slate-800 outline-none focus:border-blue-500 transition-all" 
                            placeholder="Volume (L)" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setWizardStep(1)} className="px-10 py-6 bg-slate-100 text-slate-400 rounded-3xl font-black hover:bg-slate-200 transition-all">BACK</button>
                    <button onClick={() => validateStep(2) && setWizardStep(3)} className="flex-grow bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl">Calculate Variance</button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="text-center py-10 space-y-10 animate-in zoom-in-95">
                  <div className="text-8xl">📑</div>
                  <div>
                    <h3 className="text-4xl font-black tracking-tight">Review & Commit</h3>
                    <p className="text-slate-400 text-sm font-medium mt-3 max-w-sm mx-auto">This action will update stock balances and lock the shift for auditing. Ensure Gantry and Pump deltas are correct.</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl inline-flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Authorization Node</p>
                    <p className="font-bold text-slate-800">{currentUser.name}</p>
                  </div>
                  <button onClick={handleCommit} className="w-full bg-blue-600 text-white py-8 rounded-[3rem] font-black uppercase text-lg shadow-2xl shadow-blue-100 hover:scale-[1.02] transition-transform">Finalize Operational Cycle</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-right-4">
            <h2 className="text-4xl font-black tracking-tight">Ledger Archive</h2>
            <div className="grid gap-6">
              {reconciliations.map(recon => (
                <div key={recon.id} className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row md:items-center gap-8 group hover:shadow-xl transition-all border-slate-100">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`w-3 h-3 rounded-full ${recon.fuelType === FuelType.ADO ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{recon.fuelType}</span>
                    </div>
                    <h4 className="text-2xl font-black">{recon.date}</h4>
                    <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase">ID: {recon.id.substring(0, 12)}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-10 flex-grow max-w-lg">
                    <div><p className="text-[10px] font-black text-slate-300 uppercase mb-1">Sales</p><p className="font-black text-xl">{recon.calculatedSales.toLocaleString()} L</p></div>
                    <div><p className="text-[10px] font-black text-slate-300 uppercase mb-1">Variance</p><p className={`font-black text-xl ${Math.abs(recon.variance) > 50 ? 'text-rose-600' : 'text-emerald-600'}`}>{recon.variance.toFixed(1)} L</p></div>
                    <div className="hidden md:block">
                      <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Revenue</p>
                      <p className="font-black text-xl">${recon.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => exportToCSV(recon)} className="p-4 bg-slate-50 rounded-2xl text-xl hover:bg-blue-50 transition-all">📥</button>
                    <button onClick={() => copyToClipboard(recon)} className="p-4 bg-slate-50 rounded-2xl text-xl hover:bg-blue-50 transition-all">🔗</button>
                  </div>
                </div>
              ))}
              {reconciliations.length === 0 && (
                <div className="p-32 text-center border-4 border-dashed rounded-[4rem] text-slate-200">
                   <p className="font-black text-2xl">No Ledger Data</p>
                   <button onClick={seedTestData} className="mt-8 text-blue-600 text-xs font-black uppercase hover:underline">Load Demo Data</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
