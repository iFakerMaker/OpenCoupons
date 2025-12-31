import React, { useState, useEffect, useCallback } from 'react';
import { Coupon, ViewMode, StoreInfo } from './types';
import * as couponService from './services/couponService';
import { getProcessedUrl } from './services/referralService';
import CouponCard from './components/CouponCard';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.LIST);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [missingStores, setMissingStores] = useState<{ store: string }[]>([]);
  const [referralTemplate, setReferralTemplate] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(true);

  // Fallback domain for web preview; in extension, use current tab hostname
  const domain = window.location.hostname === 'localhost' || window.location.hostname === '' || window.location.hostname.includes('webcontainer')
    ? 'nike.com' 
    : window.location.hostname;

  const currentStore: StoreInfo = {
    name: domain.split('.')[0].toUpperCase(),
    domain: domain,
    logo: `https://logo.clearbit.com/${domain}`
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const { coupons, referral } = await couponService.getStoreData(currentStore.domain);
    setCoupons(coupons || []);
    setReferralTemplate(referral);
    setLoading(false);

    const processedUrl = getProcessedUrl(window.location.href, referral);
    if (processedUrl && processedUrl !== window.location.href) {
      console.log('OpenCoupon: Applying community referral string:', processedUrl);
    }
  }, [currentStore.domain]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (view === ViewMode.TASKS) {
      couponService.getMissingReferrals().then(setMissingStores);
    }
  }, [view]);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    await couponService.saveCoupon({
      code: newCode.toUpperCase(),
      description: newDesc || 'Community added discount code',
      store: currentStore.domain,
    });

    setNewCode('');
    setNewDesc('');
    setView(ViewMode.SUCCESS);
    
    setTimeout(() => {
      loadData();
      setView(ViewMode.LIST);
    }, 1500);
  };

  const handleVote = useCallback(async (id: string, newVote: 'up' | 'down' | null) => {
    if (newVote) {
      await couponService.voteCoupon(id, newVote);
      setCoupons(prev => prev.map(c => {
        if (c.id === id) {
          const upInc = newVote === 'up' ? 1 : 0;
          const downInc = newVote === 'down' ? 1 : 0;
          return {
            ...c,
            upvotes: c.upvotes + upInc,
            downvotes: c.downvotes + downInc
          };
        }
        return c;
      }).filter(c => (c.upvotes - c.downvotes) > -5));
    }
  }, []);

  return (
    <div className="w-[380px] min-h-[500px] bg-white flex flex-col shadow-2xl overflow-hidden rounded-xl border border-gray-200">
      <header className="bg-indigo-600 px-6 py-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">OpenCoupon</h1>
          </div>
          <button 
            onClick={() => setView(view === ViewMode.TASKS ? ViewMode.LIST : ViewMode.TASKS)}
            className={`p-2 rounded-lg transition-all ${view === ViewMode.TASKS ? 'bg-white text-indigo-600 shadow-sm' : 'bg-white/10 hover:bg-white/20'}`}
            title="Registry Tasks"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
          <img 
            src={currentStore.logo} 
            onError={(e) => (e.currentTarget.src = 'https://img.icons8.com/fluency/48/shopping-cart.png')}
            alt={currentStore.name} 
            className="w-10 h-10 rounded-full bg-white object-contain border border-white/20 p-1" 
          />
          <div className="flex-1 overflow-hidden">
            <div className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">At Store</div>
            <div className="font-semibold text-sm truncate">{currentStore.domain}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {view === ViewMode.LIST && (
          <>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                D1 Verified Coupons ({coupons.length})
              </h2>
              <button onClick={() => setView(ViewMode.ADD)} className="text-indigo-600 text-xs font-bold hover:underline">
                + New Code
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-gray-400 text-xs font-medium">Fetching from D1...</p>
              </div>
            ) : coupons.length > 0 ? (
              coupons.map(coupon => (
                <CouponCard key={coupon.id} coupon={coupon} onVote={handleVote} />
              ))
            ) : (
              <div className="text-center py-12 px-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-gray-50 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm mb-4">No verified coupons for this store.</p>
                <button 
                  onClick={() => setView(ViewMode.ADD)}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm"
                >
                  Be the first to share
                </button>
              </div>
            )}
          </>
        )}

        {view === ViewMode.TASKS && (
          <div className="space-y-4">
            <h2 className="text-gray-800 text-lg font-bold">Registry Tasks</h2>
            <p className="text-gray-500 text-xs leading-relaxed">The community needs referral links for these active stores to keep the registry sustainable.</p>
            <div className="space-y-2">
              {missingStores.length > 0 ? missingStores.map(({ store }) => (
                <div key={store} className="bg-white p-3 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{store}</span>
                  <button className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-full font-bold">
                    Provide
                  </button>
                </div>
              )) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-400 text-xs italic">All stores have community referrals!</p>
                </div>
              )}
            </div>
            <button onClick={() => setView(ViewMode.LIST)} className="w-full py-2 text-indigo-600 text-xs font-bold">
              ← Back to Coupons
            </button>
          </div>
        )}

        {view === ViewMode.ADD && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Share a Code</h2>
            <p className="text-gray-400 text-xs mb-6">Help others save at <span className="text-indigo-600 font-bold">{currentStore.domain}</span></p>
            <form onSubmit={handleAddCoupon} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Coupon Code</label>
                <input 
                  type="text" autoFocus required placeholder="WELCOME20"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono font-bold text-indigo-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  value={newCode} onChange={(e) => setNewCode(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">What's the deal?</label>
                <textarea 
                  rows={2} placeholder="e.g. 20% off your first order"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-900 focus:border-indigo-400 transition-all"
                  value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setView(ViewMode.LIST)} className="flex-1 py-3 text-gray-400 text-sm font-bold">Cancel</button>
                <button type="submit" className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                  Sync to D1
                </button>
              </div>
            </form>
          </div>
        )}

        {view === ViewMode.SUCCESS && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">D1 Synced!</h2>
            <p className="text-gray-400 text-xs">Thank you for contributing.</p>
          </div>
        )}
      </main>

      <footer className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          D1 Live
        </div>
        <span>Open Source v1.2.2</span>
      </footer>
    </div>
  );
};

export default App;