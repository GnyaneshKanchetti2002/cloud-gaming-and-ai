// frontend/src/app/lib/api.ts

/**
 * Centralized API Base URL
 * In production (Vercel), this is populated by the NEXT_PUBLIC_API_URL environment variable.
 * In development, it falls back to your local FastAPI Docker container.
 * * IMPORTANT FOR DEPLOYMENT: 
 * Ensure your Vercel Environment Variable includes the /api suffix!
 * Example: https://your-render-app-name.onrender.com/api
 */

export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";