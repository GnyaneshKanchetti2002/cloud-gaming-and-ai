"use client";

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api';

function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessed = useRef(false); 

  useEffect(() => {
    const handleAuth = async () => {
      if (hasProcessed.current) return;
      
      const token = searchParams.get('token'); 
      
      if (!token) {
        console.warn("No token found in URL. Redirecting to login.");
        router.push('/login?error=missing_token');
        return;
      }

      hasProcessed.current = true;
      
      // 1. Save to LocalStorage for API calls
      localStorage.setItem('token', token);
      
      // 2. THE FIX: Save to First-Party Cookie for Next.js Middleware!
      // This allows Vercel route guards to instantly recognize the session
      document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include" 
        });
        
        if (!response.ok) throw new Error("User data fetch failed");
        
        const userData = await response.json();
        const role = userData.role; 
        localStorage.setItem('user_role', role);

        const isB2B = role === 'B2B' || role === 'b2b_enterprise';
        const intendedPath = localStorage.getItem('intended_path');

        if (intendedPath) {
          localStorage.removeItem('intended_path');
          if (intendedPath === '/enterprise' && !isB2B) {
            router.push('/gaming'); 
          } else if (intendedPath === '/gaming' && isB2B) {
            router.push('/enterprise');
          } else {
            router.push(intendedPath);
          }
        } else {
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