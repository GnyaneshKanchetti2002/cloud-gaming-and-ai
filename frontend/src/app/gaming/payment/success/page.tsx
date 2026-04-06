"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
// Assuming API_BASE_URL is exported from here
import { API_BASE_URL } from '@/app/lib/api';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying Transaction...");

  useEffect(() => {
    let pollingInterval: any;
    let initialBalance = -1;

    const checkBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Get user profile to determine ID
        const userRes = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const user = await userRes.json();

        // Query the tiered wallet balance
        const walletRes = await fetch(`${API_BASE_URL}/users/wallet/${user.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const wallet = await walletRes.json();
        
        const totalHours = wallet.esports_hours + wallet.aaa_hours + wallet.ultra_hours;

        if (initialBalance === -1) {
          // Store first ping as baseline if webhook hasn't hit yet
          initialBalance = totalHours;
        } else if (totalHours > initialBalance) {
          // Balance augmented! Webhook hit successfully.
          setStatus("Payment Confirmed! Allocating compute resources...");
          clearInterval(pollingInterval);
          setTimeout(() => {
            router.push('/gaming/wallet');
          }, 2000);
        }

      } catch (err) {
        console.error("Polling error", err);
      }
    };

    // Poll every 2 seconds
    pollingInterval = setInterval(checkBalance, 2000);
    checkBalance();

    return () => clearInterval(pollingInterval);
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="bg-zinc-900/40 p-12 rounded-3xl border border-zinc-800 text-center space-y-6 shadow-2xl backdrop-blur-xl max-w-md">
        {status.includes("Confirmed") ? (
          <CheckCircle2 size={64} className="text-emerald-400 mx-auto animate-in zoom-in" />
        ) : (
          <Loader2 size={64} className="text-fuchsia-400 animate-spin mx-auto" />
        )}
        
        <h1 className="text-2xl font-black italic uppercase tracking-wider text-white">
          {status}
        </h1>
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
          Please do not close this window. We are synchronizing your wallet with the Stripe ledger.
        </p>
      </div>
    </div>
  );
}
