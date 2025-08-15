import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ArticleResponse } from "@interfaces/article/ArticleResponse";
import { getAllArticles } from "@services/articles/articles";
import { ArticleItem } from "@components/Cards";
import { COLORS } from "@constants/colors";

export default function ShopScreen() { // Estoy en tu cesped nebbecracker 🗣️ 
    const [articleItems, setArticleItems] = useState<ArticleResponse[]>([]);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;


    const fetchArticles = useCallback(async () => {
        setIsLoading(true);
        try {
            const articles = await getAllArticles(page, pageSize);
            setArticleItems(articles.contents);
            setTotalPages(articles.totalPages);
        } catch (e) {
            console.error("Error fetching articles:", e);
            alert("Error al cargar los artículos. Por favor, inténtalo de nuevo más tarde.");
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    const nextPage = () => {
        if (page + 1 >= totalPages || isLoading) return;
        setPage(p => p + 1);
    }

    const prevPage = () => {
        if (page <= 0 || isLoading) return;
        setPage(p => p - 1);
    }

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const renderItem = ({ item }: { item: ArticleResponse }) => <ArticleItem data={item} />;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.title}>Tienda de Monedas</Text>
                <Text style={styles.subtitle}>Adquiere el paquete que prefieras</Text>
            </View>
            <FlatList
                data={articleItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No hay artículos disponibles.</Text> : null}
                refreshing={isLoading}
                onRefresh={fetchArticles}
                showsVerticalScrollIndicator={false}
            />
            <View style={styles.paginationBar}>
                <Pressable style={({ pressed }) => [styles.pageBtn, (page <= 0 || isLoading) && styles.pageBtnDisabled, pressed && styles.pageBtnPressed]} disabled={page <= 0 || isLoading} onPress={prevPage}>
                    <Text style={styles.pageBtnText}>Anterior</Text>
                </Pressable>
                <View style={styles.pageIndicator}>
                    <Text style={styles.pageNumber}>Página {page + 1} / {totalPages}</Text>
                    {isLoading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />}
                </View>
                <Pressable style={({ pressed }) => [styles.pageBtn, (page + 1 >= totalPages || isLoading) && styles.pageBtnDisabled, pressed && styles.pageBtnPressed]} disabled={page + 1 >= totalPages || isLoading} onPress={nextPage}>
                    <Text style={styles.pageBtnText}>Siguiente</Text>
                </Pressable>
            </View>
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
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.primary,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.light.textSecondary,
        marginTop: 2,
        marginBottom: 8,
    },
    listContent: {
        paddingBottom: 100,
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        color: COLORS.light.textSecondary,
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