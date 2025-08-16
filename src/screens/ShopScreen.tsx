import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ArticleResponse } from "@interfaces/article/ArticleResponse";
import { getAllArticles } from "@services/articles/articles";
import { ArticleItem } from "@components/Cards";
import { COLORS } from "@constants/colors";
import { PagedResponse } from '@interfaces/common/PagedResponse';
import { useToast } from '@hooks/useToast';
import Pagination from '@components/common/Pagination';

export default function ShopScreen() { // Estoy en tu cesped nebbecracker 🗣️ 
    const [articleItems, setArticleItems] = useState<ArticleResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery] = useState('');
    const {showError} = useToast();
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 6;
    // Cargar artiuclos de la nueva página
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

    // Primero declaras fetchArticles
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

    // Luego lo usas en useEffect
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
            {!searchQuery && articleItems.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalElements={totalElements}
                pageSize={pageSize}
              />
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