import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import { useStore } from '../../store/useStore';
import { API_BASE_URL } from '../../src/config/api';
import { mapProductToCard } from '../../src/utils/mapProduct';
import { getTheme } from '../../src/theme';

export default function WishlistScreen() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { token, fetchWishlist, isDark } = useStore();
  const t = getTheme(isDark);

  // שימוש ב-useFocusEffect מבטיח שהרשימה תתעדכן בכל פעם שהמשתמש עובר לטאב הזה
  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadWishlist();
      } else {
        setLoading(false);
      }
    }, [token])
  );

  const loadWishlist = async () => {
    try {
      setLoading(true);
      // קריאה ל-API להבאת האובייקטים המלאים של ה-Wishlist
      const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch wishlist');
      const data = await response.json();
      
      // מיפוי הנתונים: השרת מחזיר אובייקטי WishlistItem המכילים שדה product או group
      const items = data.map((item: any) => {
        if (item.product) return item.product;
        if (item.group && item.group.product) return item.group.product;
        return item;
      });

      setWishlistItems(items);
      // עדכון ה-IDs ב-Store לסנכרון סטטוס ה"לב" בכרטיסים
      await fetchWishlist(); 
    } catch (error) {
      console.error("Wishlist fetch error:", error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseDeals = () => {
    router.push('/'); 
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="heart-dislike-outline" size={80} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>Log in to see your wishlist</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login' as any)}>
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        <Text style={[styles.headerTitle, { color: t.text }]}>My Wishlist</Text>
      </View>

      <FlatList
        data={wishlistItems}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
             <ProductCard {...mapProductToCard(item)} showGroupInfo={false} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
                <Ionicons name="heart-outline" size={60} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySubtitle}>
              Save items you want to track and join groups when the price is right.
            </Text>
            <TouchableOpacity style={styles.browseButton} onPress={handleBrowseDeals}>
              <Text style={styles.browseButtonText}>Browse Deals</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  listContent: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 20, flexGrow: 1 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  cardContainer: { width: '48%' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 40 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: '#9ca3af', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  browseButton: { backgroundColor: '#228be6', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' },
  browseButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loginButton: { backgroundColor: '#228be6', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 20 },
  loginButtonText: { color: '#fff', fontWeight: 'bold' }
});