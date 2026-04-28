import { AxiosInstance, AxiosRequestConfig as BaseAxiosRequestConfig } from "axios";

interface CustomAxiosRequestConfig<D = any> extends BaseAxiosRequestConfig<D> {
  /** When true, suppresses the global error snackbar for this request */
  ignoreGlobalErrorSnack?: boolean;
}

interface CustomAxiosInstance extends Omit<AxiosInstance, "get" | "post" | "put" | "patch" | "delete" | "head" | "options" | "request"> {
  request<T = any, R = import("axios").AxiosResponse<T>, D = any>(config: CustomAxiosRequestConfig<D>): Promise<R>;
  get<T = any, R = import("axios").AxiosResponse<T>, D = any>(url: string, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  delete<T = any, R = import("axios").AxiosResponse<T>, D = any>(url: string, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  head<T = any, R = import("axios").AxiosResponse<T>, D = any>(url: string, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  options<T = any, R = import("axios").AxiosResponse<T>, D = any>(url: string, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  post<T = any, R = import("axios").AxiosResponse<T>, D = any>(url: string, data?: D, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  put<T = any, R = import("axios").AxiosResponse<T>, D = any>(url: string, data?: D, config?: CustomAxiosRequestConfig<D>): Promise<R>;
  patch<T = any, R = import("axios").AxiosResponse<T>, D = any>(url: string, data?: D, config?: CustomAxiosRequestConfig<D>): Promise<R>;
}

declare const axios: CustomAxiosInstance;

export default axios;
export declare const baseURL: string;
export declare const baseDomain: string;
