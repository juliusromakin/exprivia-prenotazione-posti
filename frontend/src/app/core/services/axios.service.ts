import { inject, Injectable } from '@angular/core';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { TokenService } from '../auth/token.service';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AxiosService {
  private axiosInstance: AxiosInstance;
  private tokenService = inject(TokenService);

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: environment.apiUrl || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.tokenService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (config.data && typeof config.data === 'object') {
          config.headers['Content-Type'] = 'application/json';
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error("401 Unauthorized received:", error.response);
          // this.tokenService.clearToken();
          // window.location.href = '/login'; // Disabilitato temporaneamente per debug
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
}