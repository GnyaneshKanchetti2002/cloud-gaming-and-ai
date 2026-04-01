// frontend/src/app/lib/api.ts

/**
 * PRODUCTION URL KILL LOGIC:
 * process.env.NEXT_PUBLIC_API_URL must be set in Vercel settings.
 */
const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // If we are in production (Vercel), enforce the provided environment variable
  if (process.env.NODE_ENV === 'production') {
    if (!envUrl) {
      console.error("Vercel Error: NEXT_PUBLIC_API_URL is undefined.");
      return ""; // Fail gracefully
    }
    return envUrl;
  }
  
  // Local development fallback
  return envUrl || "http://localhost:8000/api";
};

export const API_BASE_URL = getApiUrl();