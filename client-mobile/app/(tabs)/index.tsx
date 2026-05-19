import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Keyboard,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../../src/config/api';
import ProductCard from '../../components/ProductCard';
import { mapGroupToCard, ApiGroup } from '../../src/utils/mapProduct';
import { useStore } from '../../store/useStore';
import { getTheme } from '../../src/theme';

const STORAGE_KEY = '@search_history';

export default function HomeScreen() {
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const isDark = useStore(s => s.isDark);
  const t = getTheme(isDark);

  useFocusEffect(
    useCallback(() => {
      void fetchGroups();
      void loadHistory();
    }, [])
  );

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups`);
      const data: unknown = await res.json();
      if (!Array.isArray(data)) { setGroups([]); return; }

      const now = new Date();
      const active = (data as ApiGroup[]).filter(
        g => g.isActive && !g.isCompleted && (!g.deadline || new Date(g.deadline) > now)
      );
      setGroups(active);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
        setHistory(parsed);
      }
    } catch {
      setHistory([]);
    }
  };

  const saveToHistory = async (text: string) => {
    const value = text.trim();
    if (!value) return;
    const updated = [value, ...history.filter(h => h !== value)].slice(0, 5);
    setHistory(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter(g =>
      g.name?.toLowerCase().includes(q) ||
      g.product?.name?.toLowerCase().includes(q)
    );
  }, [groups, search]);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#228be6" /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>Active Group Deals</Text>
        <Text style={styles.bannerSubtitle}>
          Join a group and save together
        </Text>

        <View style={[styles.searchBox, { backgroundColor: t.searchBg }]}>
          <Ionicons name="search" size={16} color="#868e96" />
          <TextInput
            placeholder="Search groups or products..."
            placeholderTextColor={t.placeholder}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              void saveToHistory(search);
              Keyboard.dismiss();
            }}
            style={[styles.searchInput, { color: t.text }]}
            returnKeyType="search"
          />
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductCard {...mapGroupToCard(item)} />
        )}
        ListHeaderComponent={
          <Text style={[styles.sectionLabel, { color: t.subtext }]}>
            {search ? `Results for "${search}"` : 'All Deals'} · {filtered.length} available
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No active deals found</Text>
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    color: '#868e96',
    fontSize: 15,
  },
});
