import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, TextInput, Keyboard, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { API_BASE_URL } from '../../src/config/api';
import { getTheme } from '../../src/theme';

function getTimeLeft(deadline: string | null) {
  if (!deadline) return null;
  const total = Date.parse(deadline) - Date.now();
  if (total <= 0) return 'Ended';
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((total / (1000 * 60)) % 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

export default function GroupsScreen() {
  const [myDeals, setMyDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [leaveLoadingId, setLeaveLoadingId] = useState<string | null>(null);

  const { token, fetchJoinedGroups, leaveGroup, isDark } = useStore();
  const t = getTheme(isDark);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchMyGroups();
        fetchJoinedGroups();
      } else {
        setLoading(false);
      }
    }, [token])
  );

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/groups/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setMyDeals(await res.json());
    } catch {
      console.error('[Groups] Fetch error');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = (groupId: string, groupName: string) => {
    Alert.alert('Leave Group', `Leave "${groupName}"? Your pre-authorization will be cancelled.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive',
        onPress: async () => {
          setLeaveLoadingId(groupId);
          const ok = await leaveGroup(groupId);
          setLeaveLoadingId(null);
          if (ok) setMyDeals(prev => prev.filter(g => g.id !== groupId));
          else Alert.alert('Error', 'Could not leave group');
        },
      },
    ]);
  };

  const filtered = (() => {
    if (!Array.isArray(myDeals)) return [];
    if (!search.trim()) return myDeals;
    const q = search.toLowerCase();
    return myDeals.filter(g =>
      g.name?.toLowerCase().includes(q) || g.product?.name?.toLowerCase().includes(q)
    );
  })();

  if (loading) return (
    <View style={[styles.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator size="large" color="#228be6" />
    </View>
  );

  const renderCard = ({ item: group }: { item: any }) => {
    const pct = Math.min(group.progress ?? 0, 100);
    const isFull = group.isCompleted || pct >= 100;
    const timeLeft = getTimeLeft(group.deadline);
    const imageUrl = group.product?.imageUrl;
    const imageSource = imageUrl
      ? imageUrl.startsWith('http')
        ? { uri: imageUrl }
        : { uri: `${API_BASE_URL}/api/products/images/${imageUrl}` }
      : null;
    const isLeaving = leaveLoadingId === group.id;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}
        onPress={() => group.productId && router.push(`/product/${group.productId}`)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image source={imageSource} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? '#272932' : '#f1f3f5' }]}>
              <Ionicons name="image-outline" size={40} color={t.subtext} />
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: isFull ? '#f08c00' : '#20c997' }]}>
            <Text style={styles.badgeText}>{isFull ? 'Completed' : 'Active'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.groupName, { color: t.text }]} numberOfLines={2}>{group.name}</Text>
          <Text style={styles.price}>₪{group.product?.price || 0}</Text>

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: t.subtext }]}>
                Progress: {group.currentParticipants}/{group.minParticipants}
              </Text>
              <Text style={[styles.progressPct, { color: isFull ? '#20c997' : '#228be6' }]}>{pct}%</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: isDark ? '#33363f' : '#e9ecef' }]}>
              <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: isFull ? '#20c997' : '#228be6' }]} />
            </View>
          </View>

          {timeLeft && (
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={14} color={t.subtext} />
              <Text style={[styles.timerText, { color: t.subtext }]}>{timeLeft}</Text>
            </View>
          )}

          {group.joinedAt && (
            <Text style={[styles.joinedText, { color: t.subtext }]}>
              Joined: {new Date(group.joinedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.leaveBtn, isFull && styles.leaveBtnDisabled]}
            onPress={() => !isFull && handleLeave(group.id, group.name)}
            disabled={isFull || isLeaving}
          >
            {isLeaving ? (
              <ActivityIndicator size="small" color={isFull ? '#adb5bd' : '#ff4d4f'} />
            ) : (
              <Text style={[styles.leaveBtnText, isFull && styles.leaveBtnTextDisabled]}>
                {isFull ? 'Completed' : 'Leave Group'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>My Groups</Text>
        <Text style={styles.bannerSub}>Manage the groups you have joined</Text>
        <View style={[styles.searchBox, { backgroundColor: t.searchBg }]}>
          <Ionicons name="search" size={16} color="#868e96" />
          <TextInput
            placeholder="Search your groups..."
            placeholderTextColor={t.placeholder}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={Keyboard.dismiss}
            style={[styles.searchInput, { color: t.text }]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#adb5bd" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        renderItem={renderCard}
        ListHeaderComponent={
          filtered.length > 0 ? (
            <Text style={[styles.count, { color: t.subtext }]}>
              {filtered.length} group{filtered.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: t.iconCircle }]}>
              <Ionicons name="people-outline" size={60} color={t.subtext} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.text }]}>
              No groups yet
            </Text>
            <Text style={[styles.emptySub, { color: t.subtext }]}>
              You haven't joined any groups yet.
            </Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/')}>
              <Text style={styles.browseBtnText}>Browse All Deals</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },

  banner:      { paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20 },
  bannerTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
  bannerSub:   { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 18 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 15, color: '#212529' },

  count:       { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  list:        { padding: 16, paddingBottom: 40 },

  card:        { borderRadius: 16, marginBottom: 20, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  imageContainer: { width: '100%', height: 200, position: 'relative' },
  image:       { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  badge:       { position: 'absolute', top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText:   { color: '#fff', fontSize: 12, fontWeight: '800' },

  content:     { padding: 18, gap: 10 },
  groupName:   { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  price:       { fontSize: 18, fontWeight: '800', color: '#228be6' },

  progressSection: { gap: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressPct:   { fontSize: 13, fontWeight: '800' },
  progressBg:    { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 5 },

  timerRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerText:   { fontSize: 13, fontWeight: '600' },
  joinedText:  { fontSize: 12 },

  leaveBtn:    { marginTop: 4, padding: 13, borderRadius: 10, borderWidth: 2, borderColor: '#ff4d4f', alignItems: 'center' },
  leaveBtnDisabled: { borderColor: '#dee2e6', backgroundColor: '#f8f9fa' },
  leaveBtnText: { fontSize: 14, fontWeight: '800', color: '#ff4d4f', textTransform: 'uppercase', letterSpacing: 0.5 },
  leaveBtnTextDisabled: { color: '#adb5bd' },

  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyIcon:   { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySub:    { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  browseBtn:   { backgroundColor: '#228be6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, width: '100%', alignItems: 'center' },
  browseBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
