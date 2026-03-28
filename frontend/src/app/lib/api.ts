// This ensures the app falls back to localhost if the env variable is missing
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
