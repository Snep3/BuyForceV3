import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import { useStore } from '../../store/useStore';
import { API_BASE_URL } from '../../src/config/api';
import { mapGroupToCard } from '../../src/utils/mapProduct';

type TabType = 'ACTIVE' | 'COMPLETED' | 'FAILED';

export default function GroupsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE');
  const [myDeals, setMyDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { token, fetchJoinedGroups } = useStore();
  const router = useRouter();

  // רענון נתונים בכל פעם שהמסך עולה לפוקוס (חשוב לסנכרון לאחר עזיבת קבוצה)
  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchMyGroups();
        fetchJoinedGroups(); // סנכרון ה-IDs ב-Store
      } else {
        setLoading(false);
      }
    }, [token])
  );

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/groups/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      const data = await response.json();
      setMyDeals(data);
    } catch (error) {
      console.error("[Groups] Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDeals = () => {
    if (!Array.isArray(myDeals)) return [];
    const now = new Date();

    return myDeals.filter(deal => {
      const isExpired = deal.deadline && now > new Date(deal.deadline);
      switch (activeTab) {
        case 'ACTIVE':
          return !deal.isCompleted && !isExpired && deal.isActive;
        case 'COMPLETED':
          return deal.isCompleted;
        case 'FAILED':
          return (isExpired && !deal.isCompleted) || (!deal.isActive && !deal.isCompleted);
        default:
          return false;
      }
    });
  };

  const renderTab = (label: string, value: TabType) => (
    <TouchableOpacity 
      onPress={() => setActiveTab(value)} 
      style={[styles.tab, activeTab === value && styles.activeTab]}
    >
      <Text style={[styles.tabText, activeTab === value && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.iconCircle}>
        <Ionicons 
          name={activeTab === 'FAILED' ? "close-circle-outline" : "people-outline"} 
          size={60} 
          color="#ccc" 
        />
      </View>
      <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} groups</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'ACTIVE' 
          ? "You haven't joined any active power groups yet." 
          : `No groups found in the ${activeTab.toLowerCase()} section.`}
      </Text>
      <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
        <Text style={styles.browseButtonText}>Browse All Deals</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#228be6" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
      </View>

      <View style={styles.tabsContainer}>
        {renderTab('Active', 'ACTIVE')}
        {renderTab('Completed', 'COMPLETED')}
        {renderTab('Failed', 'FAILED')}
      </View>

      <FlatList
        data={getFilteredDeals()}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <ProductCard {...mapGroupToCard(item)} />
          </View>
        )}
        ListEmptyComponent={EmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tab: { marginRight: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#228be6' },
  tabText: { fontSize: 16, color: '#94a3b8', fontWeight: '500' },
  activeTabText: { color: '#228be6', fontWeight: 'bold' },
  listContent: { paddingHorizontal: 15, flexGrow: 1, paddingBottom: 20 },
  row: { justifyContent: 'space-between', marginBottom: 20 },
  cardContainer: { width: '48%' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  progressText: { fontSize: 12, fontWeight: 'bold', color: '#228be6' },
  timerText: { fontSize: 10, color: '#22c55e', fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, marginTop: 60 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  browseButton: { backgroundColor: '#228be6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, width: '100%', alignItems: 'center' },
  browseButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});