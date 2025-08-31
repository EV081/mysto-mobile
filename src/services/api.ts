import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class Api {
  private static _instance: Api | null = null;
  private static _imageRecognitionInstance: Api | null = null;
  private _basePath: string;
  private _authorization: string | null;

  public set authorization(value: string | null) {
    this._authorization = value;
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
  // Solo limpiar el token si es 401 (no autorizado). No limpiar en 403 (prohibido)
  // porque 403 puede significar falta de permisos y no necesariamente token inválido.
  if (error.response?.status === 401) {
          console.log('Error de autenticación detectado, limpiando token...');
          this.authorization = null;
        }
        return Promise.reject(error);
      }
    );
  }


  public static async getInstance() {
    if (!this._instance) {
      const basePath = process.env.EXPO_PUBLIC_API_BASE_URL;
      if (!basePath) {
        throw new Error('No se ha configurado la URL del backend principal.');
      }
      const token = await AsyncStorage.getItem('token');
      this._instance = new Api(basePath, token);
    }
    return this._instance;
  }

  public static async getImageRecognitionInstance() {
    if (!this._imageRecognitionInstance) {
      const basePath = process.env.EXPO_PUBLIC_API_IMAGE_RECOGNITION;
      if (!basePath) {
        throw new Error('No se ha configurado la URL del microservicio de reconocimiento de imágenes.');
      }
      this._imageRecognitionInstance = new Api(basePath, null);
    }
    return this._imageRecognitionInstance;
  }
  public static async resetInstance() {
    this._instance = null;
    return await this.getInstance();
  }

  public static async resetImageRecognitionInstance() {
    this._imageRecognitionInstance = null;
    return await this.getImageRecognitionInstance();
  }

  public async request<RequestType, ResponseType>(config: AxiosRequestConfig) {
    const headers: RawAxiosRequestHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    // Añadir Authorization solo si existe un token válido. Evita enviar 'Authorization: ""'.
    if (this._authorization) {
      headers.Authorization = `Bearer ${this._authorization}`;
    }
    const configOptions: AxiosRequestConfig = {
      ...config,
      baseURL: this._basePath,
      headers: headers,
    };
    console.log('[API REQUEST]', {
      url: configOptions.baseURL + (configOptions.url || ''),
      method: configOptions.method,
      headers: configOptions.headers,
      data: configOptions.data,
    });
    
    try {
      const response = await axios<RequestType, AxiosResponse<ResponseType>>(configOptions);
      
      console.log('[API RESPONSE SUCCESS]', {
        url: configOptions.baseURL + (configOptions.url || ''),
        data: response.data,
      });
      
      return response;
    } catch (error: any) {
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

  public async requestFormData<ResponseType>(config: AxiosRequestConfig) {
    const headers: RawAxiosRequestHeaders = {
      'Content-Type': 'multipart/form-data',
      ...config.headers,
    };

    const configOptions: AxiosRequestConfig = {
      ...config,
      baseURL: this._basePath,
      headers: headers,
    };

    console.log('[API FORMDATA REQUEST]', {
      url: configOptions.baseURL + (configOptions.url || ''),
      method: configOptions.method,
      headers: configOptions.headers,
    });
    
    try {
      const response = await axios<FormData, AxiosResponse<ResponseType>>(configOptions);
      
      console.log('[API FORMDATA RESPONSE SUCCESS]', {
        url: configOptions.baseURL + (configOptions.url || ''),
        data: response.data,
      });
      
      return response;
    } catch (error: any) {
      console.log('[API FORMDATA RESPONSE ERROR]', {
        url: configOptions.baseURL + (configOptions.url || ''),
        method: configOptions.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
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

  public postFormData<ResponseType>(
    data: FormData,
    options: AxiosRequestConfig,
  ) {
    const configOptions: AxiosRequestConfig = {
      ...options,
      method: 'POST',
      data,
    };
    return this.requestFormData<ResponseType>(configOptions);
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