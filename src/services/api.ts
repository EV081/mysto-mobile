import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clase Api para manejar peticiones HTTP en mobile
export default class Api {
  private static _instance: Api | null = null;
  private _basePath: string;
  private _authorization: string | null;

  public set authorization(value: string | null) {
    this._authorization = value;
    // Actualizar AsyncStorage de forma asíncrona
    if (value) {
      AsyncStorage.setItem('token', value).catch(error => {
        console.error('Error al guardar token en AsyncStorage:', error);
      });
    } else {
      AsyncStorage.removeItem('token').catch(error => {
        console.error('Error al remover token de AsyncStorage:', error);
      });
    }
  }

  private constructor(basePath: string, authorization: string | null) {
    this._basePath = basePath;
    this._authorization = authorization;
    
    // Configurar interceptor de respuesta para manejar errores de autenticación
    this.setupResponseInterceptor();
  }

  private setupResponseInterceptor() {
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Si el error es 401 o 403, limpiar el token automáticamente
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Error de autenticación detectado, limpiando token...');
          this.authorization = null;
        }
        return Promise.reject(error);
      }
    );
  }

  // Obtener instancia singleton
  public static async getInstance() {
    if (!this._instance) {
      // Usar solo la URL del backend desde .env
      const basePath = process.env.EXPO_PUBLIC_API_BASE_URL;
      if (!basePath) {
        throw new Error('No se ha configurado la URL del backend.');
      }
      // Recupera el token almacenado
      const token = await AsyncStorage.getItem('token');
      this._instance = new Api(basePath, token);
    }
    return this._instance;
  }

  // Método para reinicializar la instancia (útil para testing o reset)
  public static async resetInstance() {
    this._instance = null;
    return await this.getInstance();
  }

  // Método genérico para peticiones
  public async request<RequestType, ResponseType>(config: AxiosRequestConfig) {
    const headers: RawAxiosRequestHeaders = {
      'Content-Type': 'application/json',
      Authorization: this._authorization ? `Bearer ${this._authorization}` : '',
      ...config.headers,
    };
    const configOptions: AxiosRequestConfig = {
      ...config,
      baseURL: this._basePath,
      headers: headers,
    };
    // Depuración: imprimir la solicitud
    console.log('[API REQUEST]', {
      url: configOptions.baseURL + (configOptions.url || ''),
      method: configOptions.method,
      headers: configOptions.headers,
      data: configOptions.data,
    });
    
    try {
      const response = await axios<RequestType, AxiosResponse<ResponseType>>(configOptions);
      
      // Depuración: imprimir la respuesta exitosa
      console.log('[API RESPONSE SUCCESS]', {
        url: configOptions.baseURL + (configOptions.url || ''),
        // method: configOptions.method,
        // status: response.status,
        data: response.data,
      });
      
      return response;
    } catch (error: any) {
      // Depuración: imprimir la respuesta de error
      console.log('[API RESPONSE ERROR]', {
        url: configOptions.baseURL + (configOptions.url || ''),
        method: configOptions.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        headers: error.response?.headers,
      });
      
      throw error;
    }
  }

  public get<RequestType, ResponseType>(config: AxiosRequestConfig) {
    const configOptions: AxiosRequestConfig = {
      ...config,
      method: 'GET',
    };
    return this.request<RequestType, ResponseType>(configOptions);
  }

  public post<RequestBodyType, ResponseBodyType>(
    data: RequestBodyType,
    options: AxiosRequestConfig,
  ) {
    const configOptions: AxiosRequestConfig = {
      ...options,
      method: 'POST',
      data,
    };
    return this.request<RequestBodyType, ResponseBodyType>(configOptions);
  }

  public delete(options: AxiosRequestConfig) {
    const configOptions: AxiosRequestConfig = {
      ...options,
      method: 'DELETE',
    };
    return this.request<void, void>(configOptions);
  }

  public put<RequestBodyType, ResponseBodyType>(
    data: RequestBodyType,
    options: AxiosRequestConfig,
  ) {
    const configOptions: AxiosRequestConfig = {
      ...options,
      method: 'PUT',
      data: data,
    };
    return this.request<RequestBodyType, ResponseBodyType>(configOptions);
  }

  public patch<RequestBodyType, ResponseBodyType>(
    data: RequestBodyType,
    options: AxiosRequestConfig,
  ) {
    const configOptions: AxiosRequestConfig = {
      ...options,
      method: 'PATCH',
      data: data,
    };
    return this.request<RequestBodyType, ResponseBodyType>(configOptions);
  }
} 