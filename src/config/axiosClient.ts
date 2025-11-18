import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

/**
 * Request cancellation manager
 * Cancels previous pending requests to the same endpoint when a new one is made
 */
class RequestCancellationManager {
  private pendingRequests: Map<string, AbortController> = new Map();

  /**
   * Generates a unique key for a request based on URL and params
   */
  private generateRequestKey(config: AxiosRequestConfig): string {
    const { url, method = 'GET', params } = config;
    const paramsKey = params ? JSON.stringify(params) : '';
    return `${method}:${url}${paramsKey.split("=")[0]}`;
  }

  /**
   * Cancels any previous pending request to the same endpoint
   * and registers the new request
   */
  registerRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const requestKey = this.generateRequestKey(config);

    // Cancel previous pending request to the same endpoint
    const existingController = this.pendingRequests.get(requestKey);
    if (existingController) {
      console.log(`[API] Cancelling previous request to: ${config.url}`);
      existingController.abort('Cancelled due to newer request');
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    this.pendingRequests.set(requestKey, controller);

    // Attach abort signal to request config
    config.signal = controller.signal;

    return config;
  }

  /**
   * Removes request from pending map when completed
   */
  removeRequest(config: AxiosRequestConfig): void {
    const requestKey = this.generateRequestKey(config);
    this.pendingRequests.delete(requestKey);
  }

  /**
   * Cancels all pending requests (useful for cleanup)
   */
  cancelAllRequests(): void {
    console.log(`[API] Cancelling ${this.pendingRequests.size} pending requests`);
    this.pendingRequests.forEach((controller) => {
      controller.abort('Cancelled all requests');
    });
    this.pendingRequests.clear();
  }
}

// Create singleton instance
const cancellationManager = new RequestCancellationManager();

/**
 * Create configured Axios instance
 */
const createAxiosInstance = (): AxiosInstance => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 15 second timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - register and cancel previous requests
  instance.interceptors.request.use(
    (config) => {
      return cancellationManager.registerRequest(config);
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - clean up completed requests
  instance.interceptors.response.use(
    (response) => {
      cancellationManager.removeRequest(response.config);
      return response;
    },
    (error) => {
      // Remove from pending requests
      if (error.config) {
        cancellationManager.removeRequest(error.config);
      }

      // Don't throw error for cancelled requests
      if (axios.isCancel(error)) {
        console.log(`[API] Request cancelled: ${error.message}`);
        return Promise.reject({ cancelled: true, message: error.message });
      }

      // Handle other errors
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      console.error(`[API Error] ${error.config?.url}:`, errorMessage);

      return Promise.reject({
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
      });
    }
  );

  return instance;
};

// Export configured instance
export const apiClient = createAxiosInstance();

// Export manager for cleanup
export const cancelAllPendingRequests = () => {
  cancellationManager.cancelAllRequests();
};
