// frontend/src/app/gaming/pricing/page.tsx
"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cpu, Zap, Monitor, Loader2, Server, ShieldCheck, Plus, Minus } from 'lucide-react';
import { API_BASE_URL } from '@/app/lib/api';

const TIERS = [
  {
    id: "esports",
    name: "Esports / 1080p",
    vram: "8GB VRAM",
    hardware: "4 Cores, 16GB RAM",
    capability: "Flawless 1080p (Valorant, CS2, GTA V)",
    icon: <Monitor className="text-emerald-400" size={32} />,
    color: "emerald",
    hourly: { price: 35, hours: 1 },
    monthly: { price: 800, hours: 30 }
  },
  {
    id: "aaa",
    name: "AAA / 1440p",
    vram: "12GB VRAM",
    hardware: "8 Cores, 32GB RAM",
    capability: "1440p High Settings (Cyberpunk, Warzone)",
    icon: <Zap className="text-fuchsia-400" size={32} />,
    color: "fuchsia",
    hourly: { price: 50, hours: 1 },
    monthly: { price: 1200, hours: 30 }
  },
  {
    id: "ultra",
    name: "Ultra / 4K",
    vram: "24GB VRAM",
    hardware: "16 Cores, 64GB RAM",
    capability: "4K Uncompressed + Path Tracing",
    icon: <Cpu className="text-rose-400" size={32} />,
    color: "rose",
    hourly: { price: 100, hours: 1 },
    monthly: { price: 2500, hours: 30 }
  }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'hourly' | 'monthly'>('monthly');
  const [hourlyQty, setHourlyQty] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handlePayment = async (tier: any) => {
    setProcessingId(tier.id);
    
    const isHourly = billingCycle === 'hourly';
    const plan = tier[billingCycle];
    
    // Calculate final price and hours based on multiplier
    const finalPrice = isHourly ? plan.price * hourlyQty : plan.price;
    const finalHours = isHourly ? plan.hours * hourlyQty : plan.hours;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount_inr: finalPrice,
          hours_added: finalHours,
          tier_name: tier.name,
          plan_type: billingCycle,
          tier_id: tier.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.checkout_url;
      } else {
        const err = await res.json();
        alert(`Stripe Initialization Failed: ${err.detail}`);
      }
    } catch (e) {
      console.error("Payment failed", e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase drop-shadow-2xl">
          RESOURCE <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-rose-400">ALLOCATION</span>
        </h1>
        <p className="text-zinc-500 font-bold tracking-[0.3em] text-xs uppercase max-w-2xl mx-auto">
          Upgrade your compute tier. Secure uncompressed remote rendering directly to your local node.
        </p>
      </div>

      {/* Billing Toggle & Hourly Quantity */}
      <div className="flex flex-col items-center gap-6 mb-12">
        <div className="bg-zinc-900/80 p-1.5 rounded-full border border-zinc-800 flex items-center backdrop-blur-xl">
          <button 
            onClick={() => setBillingCycle('hourly')}
            className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 ${billingCycle === 'hourly' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Hourly Drop-In
          </button>
          <button 
            onClick={() => setBillingCycle('monthly')}
            className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Monthly Pass (30 Hrs)
          </button>
        </div>

        {/* Feature 4: Hourly Multiplier Input */}
        {billingCycle === 'hourly' && (
          <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 animate-in slide-in-from-top-4">
            <button 
              onClick={() => setHourlyQty(Math.max(1, hourlyQty - 1))} 
              className="p-2 hover:bg-zinc-800 rounded-xl text-white transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="w-24 text-center text-white font-black uppercase tracking-widest text-sm">
              {hourlyQty} Hours
            </span>
            <button 
              onClick={() => setHourlyQty(hourlyQty + 1)} 
              className="p-2 hover:bg-zinc-800 rounded-xl text-white transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Pricing Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TIERS.map((tier) => {
          const isProcessing = processingId === tier.id;
          const currentPlan = tier[billingCycle];
          
          // Calculate dynamic price based on cycle and multiplier
          const finalPrice = billingCycle === 'hourly' ? currentPlan.price * hourlyQty : currentPlan.price;
          
          return (
            <div key={tier.id} className="relative group bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 hover:border-zinc-600 transition-all duration-500 flex flex-col justify-between h-full shadow-2xl overflow-hidden">
              {/* Glow Effect */}
              <div className={`absolute -top-24 -right-24 w-48 h-48 bg-${tier.color}-500/10 blur-[80px] group-hover:bg-${tier.color}-500/20 transition-all duration-700 pointer-events-none`} />

              <div className="relative z-10 space-y-8">
                <div>
                  <div className="mb-6">{tier.icon}</div>
                  <h3 className="text-2xl font-black italic text-white uppercase tracking-wider mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white tracking-tighter">₹{finalPrice}</span>
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                      Total
                    </span>
                  </div>
                </div>

                <div className="space-y-4 border-t border-zinc-800/50 pt-6">
                  <div className="flex items-center gap-3">
                    <Server size={16} className={`text-${tier.color}-500`} />
                    <span className="text-zinc-300 font-bold text-xs uppercase tracking-wider">{tier.vram}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Cpu size={16} className="text-zinc-500" />
                    <span className="text-zinc-400 font-medium text-xs uppercase tracking-wider">{tier.hardware}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-zinc-500" />
                    <span className="text-zinc-400 font-medium text-xs leading-relaxed">{tier.capability}</span>
                  </div>
                </div>
              </div>

              <button 
                disabled={isProcessing}
                onClick={() => handlePayment(tier)}
                className={`relative z-10 mt-10 w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 border disabled:opacity-50
                  ${tier.id === 'aaa' ? 'bg-fuchsia-600 text-white border-fuchsia-500 hover:bg-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)]' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white'}
                `}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> SECURING UPLINK...
                  </span>
                ) : (
                  `PAY NOW (₹${finalPrice})`
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}