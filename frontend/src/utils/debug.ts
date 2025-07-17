// Debug utility for development
export const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

export const debugError = (message: string, error?: any) => {
  if (import.meta.env.DEV) {
    console.error(`[DEBUG ERROR] ${message}`, error);
    if (error?.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    if (error?.request) {
      console.error('Request details:', error.request);
    }
  }
};