// frontend/src/app/lib/api.ts

/**
 * Centralized API Base URL
 * * LOCALHOST KILL LOGIC:
 * In a Vercel production build, it strictly enforces the environment variable.
 * It will only fall back to localhost if you are explicitly running `npm run dev` locally.
 */

const getApiUrl = () => {
  // If Vercel is building for production, enforce the live URL
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.warn("CRITICAL: NEXT_PUBLIC_API_URL is missing in Vercel Environment Variables.");
    }
    // Return the env var strictly.
    return process.env.NEXT_PUBLIC_API_URL; 
  }
  
  // If running locally via 'npm run dev', allow the localhost fallback
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
};

export const API_BASE_URL = getApiUrl();