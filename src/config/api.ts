/**
 * API Configuration
 * Centralized configuration for API and WebSocket URLs
 */

// Get base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const config = {
  // Base URL for all API requests
  apiBaseUrl: API_BASE_URL,

  // WebSocket URL for real-time market data
  websocketUrl: API_BASE_URL,

  // API endpoints
  endpoints: {
    arbitrage: `${API_BASE_URL}/api/arbitrage`,
    coveredCalls: `${API_BASE_URL}/api/covered-calls`,
    // Add more endpoints as needed
  }
};

// Type-safe access to environment variables
export const env = {
  apiBaseUrl: API_BASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};
