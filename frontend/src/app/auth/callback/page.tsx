"use client";

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api';

function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessed = useRef(false); // Prevents React StrictMode double-firing

  useEffect(() => {
    const handleAuth = async () => {
      // Prevent double execution in dev/prod
      if (hasProcessed.current) return;
      
      // 1. Get the token from the URL (e.g., ?token=xyz...)
      const token = searchParams.get('token'); 
      
      // FIX 1: If someone navigates here directly without a token, kick them out.
      if (!token) {
        console.warn("No token found in URL. Redirecting to login.");
        router.push('/login?error=missing_token');
        return;
      }

      hasProcessed.current = true;
      localStorage.setItem('token', token);

      try {
        // 2. Get user role from your backend
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include" 
        });
        
        if (!response.ok) throw new Error("User data fetch failed");
        
        const userData = await response.json();
        const role = userData.role; 
        localStorage.setItem('user_role', role);

        // FIX 2: Bulletproof role checking (handles both 'B2B' and 'b2b_enterprise')
        const isB2B = role === 'B2B' || role === 'b2b_enterprise';

        // 3. FIX SCENARIOS: Check if they clicked a specific side before logging in
        const intendedPath = localStorage.getItem('intended_path');

        if (intendedPath) {
          localStorage.removeItem('intended_path');

          // Force correct routing based on role even if they clicked the wrong one
          if (intendedPath === '/enterprise' && !isB2B) {
            router.push('/gaming'); 
          } else if (intendedPath === '/gaming' && isB2B) {
            router.push('/enterprise');
          } else {
            router.push(intendedPath);
          }
        } else {
          // No intended path? Go to their default dashboard
          router.push(isB2B ? '/enterprise' : '/gaming');
        }

      } catch (error) {
        console.error("Auth Error:", error);
        router.push('/login?error=auth_failed');
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
    <Suspense fallback={
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    }>
      <AuthHandler />
    </Suspense>
  );
}