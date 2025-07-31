import { useStorageState } from "@hooks/useStorageState";
import { LoginRequest } from "@interfaces/auth/LoginRequest";
import { RegisterRequest } from "@interfaces/auth/RegisterRequest";
import Api from "@services/api";
import { login } from "@services/auth/login";
import { register } from "@services/auth/register";
import { 
	clearAuthToken, 
	saveCredentials, 
	getStoredCredentials, 
	isAutoLoginEnabled,
	disableAutoLogin,
	clearAllAuthData,
	initializeAuthCleanup
} from "@utils/authUtils";
import { createContext, ReactNode, useContext, useEffect } from "react";

interface AuthContextType {
	register: (SignupRequest: RegisterRequest) => Promise<void>;
	login: (loginRequest: LoginRequest) => Promise<void>;
	logout: () => void;
	autoLogin: () => Promise<boolean>;
	session?: string | null;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loginHandler(
	loginRequest: LoginRequest,
	setSession: (value: string | null) => void,
) {
	// Limpiar token anterior antes de hacer login
	await clearAuthToken();
	setSession(null);
	
	const response = await login(loginRequest);
	setSession(response.data.token);
	
	// Guardar credenciales para auto-login
	await saveCredentials(loginRequest.email, loginRequest.password);
}

async function signupHandler(
	signupRequest: RegisterRequest,
	setSession: (value: string | null) => void,
) {
	// Limpiar token anterior antes de hacer registro
	await clearAuthToken();
	setSession(null);
	
	const response = await register(signupRequest);
	setSession(response.data.token);
	
	// Guardar credenciales para auto-login
	await saveCredentials(signupRequest.email, signupRequest.password);
}

export function AuthProvider(props: { children: ReactNode }) {
	const [[isLoading, session], setSession] = useStorageState("token");

	// Inicializar limpieza de autenticación al cargar la app
	useEffect(() => {
		initializeAuthCleanup();
	}, []);

	// Sincronizar el token con la instancia de Api cuando cambie
	useEffect(() => {
		const syncTokenWithApi = async () => {
			try {
				const api = await Api.getInstance();
				if (session) {
					api.authorization = session;
					console.log('Token sincronizado con la API');
				} else {
					api.authorization = null;
					console.log('Token limpiado de la API');
				}
			} catch (error) {
				console.error('Error al sincronizar token con API:', error);
			}
		};
		
		syncTokenWithApi();
	}, [session]);

	// Función para auto-login
	const autoLogin = async (): Promise<boolean> => {
		try {
			const autoLoginEnabled = await isAutoLoginEnabled();
			if (!autoLoginEnabled) {
				return false;
			}

			const credentials = await getStoredCredentials();
			if (!credentials) {
				return false;
			}

			// Intentar hacer login automático
			const response = await login({
				email: credentials.email,
				password: credentials.password
			});

			setSession(response.data.token);
			console.log('Auto-login exitoso');
			return true;
		} catch (error) {
			console.error('Error en auto-login:', error);
			// Si falla el auto-login, limpiar las credenciales
			await disableAutoLogin();
			return false;
		}
	};

	return (
		<AuthContext.Provider
			value={{
				register: (signupRequest) => signupHandler(signupRequest, setSession),
				login: (loginRequest) => loginHandler(loginRequest, setSession),
				logout: async () => {
					await clearAllAuthData();
					setSession(null);
				},
				autoLogin,
				session,
				isLoading,
			}}
		>
			{props.children}
		</AuthContext.Provider>
	);
}

export function useAuthContext() {
	const context = useContext(AuthContext);
	if (context === undefined)
		throw new Error("useAuthContext must be used within a AuthProvider");
	return context;
}
