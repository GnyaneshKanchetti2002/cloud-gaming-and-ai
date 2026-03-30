"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api';

function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      // 1. Get the token from the URL (e.g., ?token=xyz...)
      const token = searchParams.get('token'); 
      
      if (token) {
        localStorage.setItem('token', token);

        try {
          // 2. Get user role from your backend
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include" // <--- FIX: Ensures secure cookies are sent cross-port
          });
          
          if (!response.ok) throw new Error("User data fetch failed");
          
          const userData = await response.json();
          const role = userData.role; // Assuming 'B2B' or 'B2C'
          localStorage.setItem('user_role', role);

          // 3. FIX SCENARIOS: Check if they clicked a specific side before logging in
          const intendedPath = localStorage.getItem('intended_path');

          if (intendedPath) {
            localStorage.removeItem('intended_path');

            // Force correct routing based on role even if they clicked the wrong one
            if (intendedPath === '/enterprise' && role !== 'B2B') {
              router.push('/gaming'); 
            } else if (intendedPath === '/gaming' && role !== 'B2C') {
              router.push('/enterprise');
            } else {
              router.push(intendedPath);
            }
          } else {
            // No intended path? Go to their default dashboard
            router.push(role === 'B2B' ? '/enterprise' : '/gaming');
          }

        } catch (error) {
          console.error("Auth Error:", error);
          router.push('/login?error=auth_failed');
        }
      }
    };

    handleAuth();
  }, [searchParams, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-white font-medium tracking-tighter animate-pulse">
        SYNCING LIQUID COMPUTE POOL...
      </div>
    </div>
  );
}

export default function DiscordCallback() {
  return (
    <Suspense fallback={<div className="bg-slate-950 h-screen" />}>
      <AuthHandler />
    </Suspense>
  );
}