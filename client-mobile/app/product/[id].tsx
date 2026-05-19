import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Dimensions, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { API_BASE_URL } from '../../src/config/api';
import { getTheme } from '../../src/theme';

const { width } = Dimensions.get('window');

function getTimeLeft(deadline: string | null) {
  if (!deadline) return null;
  const total = Date.parse(deadline) - Date.now();
  if (total <= 0) return 'Ended';
  const days  = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const mins  = Math.floor((total / (1000 * 60)) % 60);
  const secs  = Math.floor((total / 1000) % 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const { toggleWishlist, isWishlisted, joinGroup, leaveGroup, hasJoined, token, fetchWishlist, fetchJoinedGroups, isDark } = useStore();
  const t = getTheme(isDark);
  const productId = typeof id === 'string' ? id : '';

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Product not found');
        setProduct(await response.json());
        if (token) await Promise.all([fetchWishlist(), fetchJoinedGroups()]);
      } catch {
        Alert.alert('Error', 'Could not load details.');
      } finally {
        setLoading(false);
      }
    };
    if (productId) void initData();
  }, [productId, token]);

  // Tick every second so the countdown updates live
  useEffect(() => {
    const timer = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date();
  const activeGroup = product?.groups?.find((g: any) =>
    g.isActive && !g.isCompleted && (!g.deadline || new Date(g.deadline) > now)
  );
  const completedGroup = !activeGroup && product?.groups?.find((g: any) => g.isCompleted);

  const isInWishlist = isWishlisted(productId);
  const isJoined = activeGroup ? hasJoined(activeGroup.id) : false;

  const joinedCount  = activeGroup?.currentParticipants ?? activeGroup?.members?.length ?? 0;
  const targetCount  = activeGroup?.minParticipants || 0;
  const progressPct  = targetCount > 0 ? Math.round((joinedCount / targetCount) * 100) : 0;

  const discountPct      = Number(activeGroup?.discountPercent ?? 0);
  const originalPrice    = Number(product?.price ?? 0);
  const discountedPrice  = discountPct > 0
    ? Math.round(originalPrice * (1 - discountPct / 100) * 100) / 100
    : originalPrice;

  const timeLeft = getTimeLeft(activeGroup?.deadline ?? null);

  const imageUri = product?.imageUrl?.startsWith('http')
    ? product.imageUrl
    : `${API_BASE_URL}/api/products/images/${product?.imageUrl}`;

  const handleActionPress = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please log in to participate.', [
        { text: 'Cancel' }, { text: 'Login', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    if (!activeGroup) return;

    if (isJoined) {
      Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave', style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const success = await leaveGroup(activeGroup.id);
            setActionLoading(false);
            if (success) {
              Alert.alert('Done', 'You have left the group.');
              const res = await fetch(`${API_BASE_URL}/api/products/${productId}`);
              if (res.ok) setProduct(await res.json());
            }
          },
        },
      ]);
    } else {
      Alert.alert('Join Group', `Join the group deal for "${product.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            const success = await joinGroup(activeGroup.id);
            setActionLoading(false);
            if (success) {
              Alert.alert('Success!', 'You have joined the group.');
              router.replace('/(tabs)/groups' as any);
            }
          },
        },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={{ paddingBottom: activeGroup ? 140 : 40 }} showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={[styles.imageContainer, { backgroundColor: isDark ? '#1c1e26' : '#f3f4f6' }]}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </View>

        {/* Content card */}
        <View style={[styles.content, { backgroundColor: t.card }]}>

          {/* Category + Active badge row */}
          <View style={styles.badgeRow}>
            {product?.category && (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{product.category}</Text>
              </View>
            )}
            {activeGroup && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>

          {/* Group name + product name */}
          {activeGroup && (
            <Text style={[styles.groupName, { color: t.text }]}>{activeGroup.name}</Text>
          )}
          <Text style={[styles.productSubtitle, { color: t.subtext }]}>{product?.name}</Text>

          {/* Price row */}
          <View style={styles.priceRow}>
            <Text style={styles.discountedPrice}>₪{discountedPrice}</Text>
            {discountPct > 0 && (
              <>
                <Text style={styles.originalPrice}>₪{originalPrice}</Text>
                <View style={styles.offBadge}>
                  <Text style={styles.offBadgeText}>{discountPct}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* Group section */}
          {activeGroup ? (
            <View style={styles.groupSection}>
              {/* Members progress */}
              <View style={styles.progressRow}>
                <Text style={[styles.membersText, { color: t.subtext }]}>
                  {joinedCount} / {targetCount} members
                </Text>
                <Text style={[styles.pctText, { color: '#228be6' }]}>{progressPct}%</Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#33363f' : '#e9ecef' }]}>
                <View style={[styles.progressBarFill, { width: `${Math.min(progressPct, 100)}%` as any }]} />
              </View>
            </View>
          ) : completedGroup ? (
            <View style={[styles.statusCard, { backgroundColor: isDark ? '#2a1515' : '#fff5f5', borderColor: isDark ? '#5f1e1e' : '#ffc9c9' }]}>
              <Text style={styles.completedTitle}>This group deal is now closed</Text>
              <Text style={[styles.completedSub, { color: t.subtext }]}>
                All spots for <Text style={{ fontWeight: '700' }}>{completedGroup.name}</Text> have been filled.
              </Text>
            </View>
          ) : (
            <View style={[styles.statusCard, { backgroundColor: isDark ? '#1e1a10' : '#fffbeb', borderColor: isDark ? '#4a3800' : '#fde68a' }]}>
              <Text style={[styles.noGroupText, { color: isDark ? '#fbbf24' : '#92400e' }]}>No active group deal for this product</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: t.border }]} />

          {/* Description */}
          {product?.description && (
            <>
              <Text style={[styles.sectionTitle, { color: t.text }]}>Description</Text>
              <Text style={[styles.description, { color: t.subtext }]}>{product.description}</Text>
            </>
          )}

          {/* Stock */}
          {product?.stock != null && (
            <View style={styles.stockRow}>
              <Text style={[styles.stockLabel, { color: t.subtext }]}>Stock:</Text>
              <Text style={[styles.stockValue, { color: product.stock > 0 ? '#20c997' : '#fa5252' }]}>
                {product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky footer — countdown + join */}
      {activeGroup && (
        <View style={[styles.footer, { backgroundColor: t.card, borderTopColor: t.border, paddingBottom: insets.bottom + 10 }]}>
          {timeLeft && timeLeft !== 'Ended' && (
            <View style={styles.countdownRow}>
              <Text style={[styles.countdownLabel, { color: t.subtext }]}>Ends in:</Text>
              <View style={styles.countdownPill}>
                <Text style={styles.countdownText}>{timeLeft}</Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[styles.joinButton, isJoined && styles.leaveButton]}
            onPress={handleActionPress}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinButtonText}>{isJoined ? 'Leave Group' : 'Join Group'}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Floating back + heart */}
      <View style={[styles.floatingHeader, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => toggleWishlist(productId)}>
          <Ionicons name={isInWishlist ? 'heart' : 'heart-outline'} size={22} color={isInWishlist ? '#ef4444' : '#333'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },

  imageContainer: { width, height: 320, position: 'relative' },
  image:          { width: '100%', height: '100%' },
  activeBadge:    { backgroundColor: '#20c997', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  activeBadgeText:{ color: '#fff', fontSize: 12, fontWeight: '800' },

  content:        { borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, padding: 22, gap: 12 },

  catBadge:       { backgroundColor: '#e7f5ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  catBadgeText:   { color: '#228be6', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  badgeRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupName:      { fontSize: 20, fontWeight: '900' },
  productSubtitle:{ fontSize: 14, marginTop: -4 },

  priceRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  discountedPrice:{ fontSize: 28, fontWeight: '900', color: '#228be6' },
  originalPrice:  { fontSize: 16, color: '#adb5bd', textDecorationLine: 'line-through' },
  offBadge:       { backgroundColor: '#ebfbee', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  offBadgeText:   { color: '#2f9e44', fontSize: 12, fontWeight: '800' },

  groupSection:   { gap: 10 },
  progressRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  membersText:    { fontSize: 14, fontWeight: '600' },
  pctText:        { fontSize: 14, fontWeight: '800' },
  progressBarBg:  { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill:{ height: '100%', backgroundColor: '#228be6', borderRadius: 4 },

  countdownRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countdownLabel: { fontSize: 14, fontWeight: '600' },
  countdownPill:  { backgroundColor: '#fff1f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  countdownText:  { color: '#cf1322', fontSize: 13, fontWeight: '700' },

  joinButton:     { backgroundColor: '#228be6', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  leaveButton:    { backgroundColor: '#ef4444' },
  joinButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  statusCard:     { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  completedTitle: { fontSize: 14, fontWeight: '800', color: '#c0392b' },
  completedSub:   { fontSize: 13, lineHeight: 20 },
  noGroupText:    { fontSize: 14, fontWeight: '600', textAlign: 'center' },

  divider:        { height: 1, marginVertical: 4 },
  sectionTitle:   { fontSize: 16, fontWeight: '800' },
  description:    { fontSize: 15, lineHeight: 24 },
  stockRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockLabel:     { fontSize: 14, fontWeight: '600' },
  stockValue:     { fontSize: 14, fontWeight: '700' },

  footer:         { position: 'absolute', bottom: 0, width: '100%', borderTopWidth: 1, paddingTop: 12, paddingHorizontal: 20, gap: 10 },
  floatingHeader: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  floatingLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton:     { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
});
