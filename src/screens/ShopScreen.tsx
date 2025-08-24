import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback, useRef} from "react";
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
    const pageSize = 4;

    const [currentPage2, setCurrentPage2] = useState(0);
    const [totalPages2, setTotalPages2] = useState(0);
    const [totalElements2, setTotalElements2] = useState(0);
    const pageSize2 = 4;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCosmetics, setShowCosmetics] = useState(false);
    const [lockedCosmetics, setLockedCosmetics] = useState<Cosmetic[]>([]);
    const [loadingCosmetics, setLoadingCosmetics] = useState(false);
    const isInitialLoad = useRef(true);
    const [userCoins, setUserCoins] = useState<number>(0);
    const [loadingCoins, setLoadingCoins] = useState(false);

    const loadCosmetics = useCallback(async (page: number = 0) => {
        try {
            console.log(`Loading cosmetics for page: ${page}`);
            setLoadingCosmetics(true);
            const data = await getLockedCosmetics(page, pageSize2);
            console.log(`Loaded ${data.contents.length} cosmetics, total pages: ${data.totalPages}`);
            setLockedCosmetics(data.contents);
            setCurrentPage2(data.page);
            setTotalPages2(data.totalPages);
            setTotalElements2(data.totalElements);
        } catch (e: any) {
            console.error('Error loading cosmetics:', e);
            showError(e?.response?.data?.message || "No se pudieron cargar los cosméticos");
        } finally {
            setLoadingCosmetics(false);
        }
    }, [showError, pageSize2]);

    const loadArticles = useCallback(async (page: number = 0) => {
    try {
        setIsLoading(true); 
        const data = await getAllArticles(page, pageSize);

        setArticleItems(data.contents);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
    } catch (e: any) {
        showError(e?.response?.data?.message || "No se pudieron cargar los objetos culturales");
    } finally {
        setIsLoading(false); 
        setIsRefreshing(false);
    }
    }, [pageSize, showError]);




    const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadArticles(page);
    }, [loadArticles]);
    
    const handlePageChangeCosmetics = useCallback((page: number) => {
        setCurrentPage2(page);
        loadCosmetics(page);
    }, [loadCosmetics]);

    const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadArticles(currentPage);
    }, [loadArticles, currentPage]);

    useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        loadArticles(0);
    }
    }, [loadArticles]);

    useEffect(() => {
        if (showCosmetics) {
            loadCosmetics(0);
        } else {
            // Reset cosmetics loading state when switching to articles
            setLoadingCosmetics(false);
        }
    }, [showCosmetics, loadCosmetics]);

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
            loadCosmetics(currentPage2);
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
                        onPress={() => {
                            setShowCosmetics(false);
                            // Reset cosmetics pagination when switching to articles
                            setCurrentPage2(0);
                        }}
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
                        onPress={() => {
                            setShowCosmetics(true);
                            // Reset articles pagination when switching to cosmetics
                            setCurrentPage(0);
                        }}
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
                    <>
                        <FlatList
                            key="cosmetics-list"
                            data={lockedCosmetics}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderCosmeticItem}
                            contentContainerStyle={styles.shopListContent}
                            ListEmptyComponent={<Text style={styles.empty}>No hay cosméticos disponibles.</Text>}
                            showsVerticalScrollIndicator={false}
                            numColumns={2}
                        />
                        {(!searchQuery && lockedCosmetics.length > 0) && (
                            <Pagination
                                currentPage={currentPage2}
                                totalPages={totalPages2}
                                onPageChange={handlePageChangeCosmetics}
                                totalElements={totalElements2}
                                pageSize={pageSize2}
                            />
                        )}
                    </>
                )
            ) : (
                <>
                    <FlatList
                        key="articles-list"
                        data={articleItems}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderArticleItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No hay artículos disponibles.</Text> : null}
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
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