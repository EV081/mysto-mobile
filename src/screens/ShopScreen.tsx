import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { ArticleResponse } from "@interfaces/article/ArticleResponse";
import { getAllArticles } from "@services/articles/articles";
import { ArticleItem } from "@components/Cards";

export default function ShopScreen() {
    const [articleItems, setArticleItems] = useState<ArticleResponse[]>([]);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;


    const fetchArticles = async () => {
        setIsLoading(true);
        const articles = await getAllArticles(page, pageSize);
        setArticleItems(articles.contents);
        setTotalPages(articles.totalPages);
        setIsLoading(false);
    }

    const nextPage = () => {
        if (page + 1 >= totalPages) return;
        setPage(page + 1);
        fetchArticles();
    }

    const prevPage = () => {
        if (page <= 0) return;
        setPage(page - 1);
        fetchArticles();
    }

    useEffect(() => {
        fetchArticles();
    }, []);

    return (
        <SafeAreaView>

            <Text> Bienvenido a la tienda de articulos </Text>
            <Text>Adquire monedas al precio que gustes</Text>
            <View>
                <Button title="Anterior" onPress={prevPage} disabled={page <= 0 || isLoading} />
                <Text>{page + 1}</Text>
                <Button title="Siguiente" onPress={nextPage} disabled={page + 1 >= totalPages || isLoading} />
            </View>


            {articleItems.map((item) => (
                <ArticleItem key={item.id} data={item} />
            ))}

            <Button title="Cargar método de pago" />
        </SafeAreaView>
    )
}