import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View, TouchableOpacity, Image, Alert } from "react-native";
import { ArticleResponse } from "@interfaces/article/ArticleResponse";
import { getAllArticles } from "@services/articles/articles";
import { ArticleItem } from "@components/Cards";
import { COLORS } from "@constants/colors";
import { PagedResponse } from '@interfaces/common/PagedResponse';
import { useToast } from '@hooks/useToast';
import Pagination from '@components/common/Pagination';
import { getLockedCosmetics } from "@services/cosmetics/getLockedCosmetics";
import { buyCosmetic } from "@services/cosmetics/buyCosmetic";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";
import ShopCosmeticCard from "@components/Cosmetics/ShopCosmeticCard";
import { getCurrentUser } from "@services/users/currentUser";

const coinImage = require("../../assets/coin.png");

export default function ShopScreen() {
    const [articleItems, setArticleItems] = useState<ArticleResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery] = useState('');
    const {showError, showSuccess} = useToast();
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 6;

    const [showCosmetics, setShowCosmetics] = useState(false);
    const [lockedCosmetics, setLockedCosmetics] = useState<Cosmetic[]>([]);
    const [loadingCosmetics, setLoadingCosmetics] = useState(false);

    const [userCoins, setUserCoins] = useState<number>(0);
    const [loadingCoins, setLoadingCoins] = useState(false);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        const loadPageObjects = async () => {
            try {
                const data = await getAllArticles(page, pageSize);
                setArticleItems(data.contents);
                setCurrentPage(data.paginaActual);
                setTotalPages(data.totalPaginas);
                setTotalElements(data.totalElementos);
            } catch (e) {
                showError("No se pudieron cargar los objetos culturales");
            }
        };
        loadPageObjects();
    }, [showError]);

    const fetchArticles = useCallback(async () => {
        try {
            setIsLoading(true);
            const data: PagedResponse<ArticleResponse> = await getAllArticles(currentPage, pageSize);
            setArticleItems(data.contents);
            setCurrentPage(data.paginaActual);
            setTotalPages(data.totalPaginas);
            setTotalElements(data.totalElementos);
        } catch (e) {
            showError('No se pudieron cargar los articulos');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize, showError]);

    useEffect(() => {
        if (!showCosmetics) {
            fetchArticles();
        }
    }, [fetchArticles, showCosmetics]);

    // Fetch locked cosmetics when switching tab
    const fetchLockedCosmetics = useCallback(async () => {
        try {
            setLoadingCosmetics(true);
            const data = await getLockedCosmetics();
            setLockedCosmetics(data);
        } catch (e) {
            showError('No se pudieron cargar los cosméticos');
        } finally {
            setLoadingCosmetics(false);
        }
    }, [showError]);

    useEffect(() => {
        if (showCosmetics) {
            fetchLockedCosmetics();
        }
    }, [showCosmetics, fetchLockedCosmetics]);

    const fetchUserCoins = useCallback(async () => {
        setLoadingCoins(true);
        try {
            const userRes = await getCurrentUser();
            setUserCoins(userRes.data.coins || 0);
        } catch {
            setUserCoins(0);
        } finally {
            setLoadingCoins(false);
        }
    }, []);

    useEffect(() => {
        fetchUserCoins();
    }, [showCosmetics, lockedCosmetics]);

    const handleBuyCosmetic = async (cosmetic: Cosmetic) => {
        try {
            await buyCosmetic(cosmetic.id);
            Alert.alert("Éxito", "¡Cosmético desbloqueado!");
            fetchLockedCosmetics();
            fetchUserCoins();
        } catch (error: any) {
            let errorMessage = "No se pudo comprar el cosmético";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.response?.status === 500) {
                errorMessage = "No tienes suficientes monedas para comprar este cosmético.";
            }
            Alert.alert("Error", errorMessage);
        }
    };

    const renderCosmeticItem = ({ item }: { item: Cosmetic }) => (
        <ShopCosmeticCard cosmetic={item} onBuy={() => handleBuyCosmetic(item)} />
    );

    const renderArticleItem = ({ item }: { item: ArticleResponse }) => <ArticleItem data={item} />;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.shopEmoji}>🏪</Text>
                <View style={styles.coinsRow}>
                    <Image source={coinImage} style={styles.coinIcon} />
                    {loadingCoins ? (
                        <ActivityIndicator size="small" />
                    ) : (
                        <Text style={styles.coinsText}>{userCoins}</Text>
                    )}
                </View>
                <View style={styles.switchRow}>
                    <TouchableOpacity
                        style={[
                            styles.switchBtn,
                            !showCosmetics && styles.switchBtnActive
                        ]}
                        onPress={() => setShowCosmetics(false)}
                    >
                        <Text style={[
                            styles.switchBtnText,
                            !showCosmetics && styles.switchBtnTextActive
                        ]}>Monedas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.switchBtn,
                            showCosmetics && styles.switchBtnActive
                        ]}
                        onPress={() => setShowCosmetics(true)}
                    >
                        <Text style={[
                            styles.switchBtnText,
                            showCosmetics && styles.switchBtnTextActive
                        ]}>Cosméticos</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>
                    {showCosmetics ?
                        "Desbloquea nuevos cosméticos para tu avatar" :
                        "Adquiere el paquete de monedas que prefieras"}
                </Text>
            </View>

            {showCosmetics ? (
                loadingCosmetics ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="large" />
                        <Text>Cargando cosméticos...</Text>
                    </View>
                ) : lockedCosmetics.length === 0 ? (
                    <Text style={styles.empty}>¡Ya tienes todos los cosméticos desbloqueados!</Text>
                ) : (
                    <FlatList
                        data={lockedCosmetics}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderCosmeticItem}
                        contentContainerStyle={styles.shopListContent}
                        ListEmptyComponent={<Text style={styles.empty}>No hay cosméticos disponibles.</Text>}
                        showsVerticalScrollIndicator={false}
                        numColumns={2}
                    />
                )
            ) : (
                <>
                    <FlatList
                        data={articleItems}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderArticleItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No hay artículos disponibles.</Text> : null}
                        refreshing={isLoading}
                        onRefresh={fetchArticles}
                        showsVerticalScrollIndicator={false}
                    />
                    {!searchQuery && articleItems.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            totalElements={totalElements}
                            pageSize={pageSize}
                        />
                    )}
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.light.background,
        paddingBottom: 16,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
    },
    shopEmoji: {
        fontSize: 40,
        textAlign: "center",
        marginBottom: 2,
    },
    coinsRow: {
        position: "absolute",
        right: 24,
        top: 18,
        flexDirection: "row",
        alignItems: "center",
    },
    coinIcon: {
        width: 24,
        height: 24,
        marginRight: 5,
    },
    coinsText: {
        fontSize: 17,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    title: {
        display: "none", // Oculto, solo emoji se muestra
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.light.textSecondary,
        marginTop: 2,
        marginBottom: 8,
        textAlign: "center",
    },
    listContent: {
        paddingBottom: 100,
    },
    shopListContent: {
        paddingVertical: 20,
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: "center",
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        color: COLORS.light.textSecondary,
    },
    switchRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 8,
        gap: 12,
        width: "100%",
    },
    switchBtn: {
        backgroundColor: "#e0e7ef",
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 14,
        marginHorizontal: 4,
    },
    switchBtnActive: {
        backgroundColor: COLORS.primary,
    },
    switchBtnText: {
        fontSize: 16,
        color: "#334155",
        fontWeight: "600",
    },
    switchBtnTextActive: {
        color: "#fff",
        fontWeight: "bold",
    },
    paginationBar: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: COLORS.light.border,
    },
    pageBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    pageBtnDisabled: {
        backgroundColor: '#BFA6D4',
        shadowOpacity: 0,
    },
    pageBtnPressed: {
        transform: [{ scale: 0.95 }],
        opacity: 0.85,
    },
    pageBtnText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    pageIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pageNumber: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.light.text,
    },
});