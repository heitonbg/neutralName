import axios from 'axios';
import { maxBridge } from '../utils/maxBridge.js';

export const apiBaseUrl = String(import.meta.env?.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status, code, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function createApiClient({
  baseURL,
  getInitData = () => maxBridge.getInitData(),
  timeout = 12_000,
} = {}) {
  const client = axios.create({
    baseURL,
    timeout,
  });

  client.interceptors.request.use((config) => {
    if (!baseURL) {
      throw new ApiError('Не настроен адрес API. Укажите VITE_API_URL.');
    }

    const initData = getInitData();
    if (initData) {
      config.headers.set('Authorization', `tma ${initData}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error instanceof ApiError) return Promise.reject(error);

      const status = error.response?.status;
      const code = error.response?.data?.code;
      const message =
        error.response?.data?.error ||
        (error.code === 'ECONNABORTED'
          ? 'Сервер не ответил. Попробуйте ещё раз.'
          : status
            ? `Ошибка ${status}`
            : 'Не удалось связаться с сервером. Проверьте подключение к интернету.');

      return Promise.reject(new ApiError(message, { status, code, cause: error }));
    }
  );
  return client;
}

export const apiClient = createApiClient({ baseURL: apiBaseUrl });

export async function apiRequest(path, options = {}) {
  const { timeoutMs, headers, body, method = 'GET', ...requestOptions } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  return apiClient.request({
    url: path,
    method,
    data: body,
    headers: isFormData ? headers : { 'Content-Type': 'application/json', ...headers },
    timeout: timeoutMs ?? apiClient.defaults.timeout,
    ...requestOptions,
  });
}
