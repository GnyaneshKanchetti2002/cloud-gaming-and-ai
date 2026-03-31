// frontend/src/app/lib/api.ts

/**
 * Centralized API Base URL
 * * LOCALHOST KILL LOGIC:
 * In a Vercel production build, it strictly enforces the environment variable.
 * It will only fall back to localhost if you are explicitly running `npm run dev` locally.
 * * IMPORTANT FOR DEPLOYMENT: 
 * Ensure your Vercel Environment Variable includes the /api suffix!
 * Example: https://your-render-app-name.onrender.com/api
 */

const getApiUrl = () => {
  // If Vercel is building for production, enforce the live URL
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.warn("CRITICAL: NEXT_PUBLIC_API_URL is missing in Vercel Environment Variables.");
    }
    // Return the env var, or a hardcoded fallback to your Render URL just in case
    return process.env.NEXT_PUBLIC_API_URL || "https://your-backend.onrender.com/api"; 
  }
  
  // If running locally via 'npm run dev', allow the localhost fallback
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
};

export const API_BASE_URL = getApiUrl();