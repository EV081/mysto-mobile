import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => Promise<void>];

export async function setStorageItemAsync(key: string, value: string | null) {
	try {
		if (value === null) {
			await AsyncStorage.removeItem(key);
		} else {
			await AsyncStorage.setItem(key, value);
		}
	} catch (error) {
		console.error("Error setting storage item: ", error);
		throw error; // Re-lanzar el error para que pueda ser manejado
	}
}

export async function getStorageItemAsync(key: string): Promise<string | null> {
	try {
		return await AsyncStorage.getItem(key);
	} catch (error) {
		console.error("Error getting storage item: ", error);
		return null;
	}
}

export function useStorageState(key: string): UseStateHook<string> {
	const [loading, setLoading] = useState(true);
	const [value, setValueState] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const v = await getStorageItemAsync(key);
				setValueState(v);
			} catch (error) {
				console.error("Error getting storage item: ", error);
				setValueState(null);
			} finally {
				setLoading(false);
			}
		})();
	}, [key]);

	const setValue = useCallback(
		async (v: string | null) => {
			try {
				setValueState(v);
				await setStorageItemAsync(key, v);
			} catch (error) {
				console.error("Error setting storage value: ", error);
				// Revertir el estado si falla la escritura
				setValueState(value);
				throw error;
			}
		},
		[key, value],
	);

	return [[loading, value], setValue];
}
