import { RegisterRequest } from "@interfaces/auth/RegisterRequest";
import { AuthResponse } from "@interfaces/auth/AuthResponse";
import Api from "@services/api";

export async function register(registerRequest: RegisterRequest): Promise<AuthResponse> {
  const api = await Api.getInstance();

  api.authorization = null;

  const res = await api.post<RegisterRequest, AuthResponse>(
    registerRequest,
    { url: "/auth/signup" }
  );
  const status = (res as any)?.status ?? 0;
  if (status < 200 || status >= 300) {
    const msg =
      (res as any)?.data?.message ||
      (res as any)?.message ||
      "No se pudo crear la cuenta";
    const err: any = new Error(msg);
    err.response = res;
    throw err;
  }

  const token = res?.data?.token;
  if (!token) {
    const err: any = new Error("Respuesta inválida del servidor (falta token).");
    err.response = res;
    throw err;
  }

  api.authorization = token;
  return res.data; 
}
