import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../src/config/api';
import ProductCard from '../../components/ProductCard';
import { mapProductToCard } from '../../src/utils/mapProduct';
import type { ApiProduct } from '../../src/types/product';

export default function ProductsScreen() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      const data: unknown = await res.json();
      setProducts(Array.isArray(data) ? (data as ApiProduct[]) : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      p =>
        p.name?.toLowerCase().includes(q) ||
        (p as any).category?.toLowerCase().includes(q)
    );
  }, [products, search]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#228be6" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>All Products</Text>
        <Text style={styles.bannerSubtitle}>
          Discover products available for group buying
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#868e96" />
          <TextInput
            placeholder="Search products or categories..."
            placeholderTextColor="#adb5bd"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => Keyboard.dismiss()}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ProductCard {...mapProductToCard(item)} />}
        ListHeaderComponent={
          <Text style={styles.sectionLabel}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No products found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  banner: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 18,
    lineHeight: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 15,
    color: '#212529',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#868e96',
    marginBottom: 12,
  },
  row: { gap: 12 },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    color: '#868e96',
    fontSize: 15,
  },
});
