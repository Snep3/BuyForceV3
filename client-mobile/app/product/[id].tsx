import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { API_BASE_URL } from '../../src/config/api'; 

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const { toggleWishlist, isWishlisted, joinGroup, leaveGroup, hasJoined, token, fetchWishlist, fetchJoinedGroups } = useStore();
  const productId = typeof id === 'string' ? id : '';

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data);

        if (token) await Promise.all([fetchWishlist(), fetchJoinedGroups()]);
      } catch (error) {
        console.error("Init error:", error);
        Alert.alert("Error", "Could not load details.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) initData();
  }, [productId, token]);

  const now = new Date();
  const activeGroup = product?.groups?.find((g: any) => 
    g.isActive && 
    !g.isCompleted && 
    (!g.deadline || new Date(g.deadline) > now)
  );

  const isInWishlist = isWishlisted(productId);
  const isJoined = activeGroup ? hasJoined(activeGroup.id) : false;

  const joinedCount = activeGroup?.currentParticipants ?? activeGroup?.members?.length ?? 0;
  const targetCount = activeGroup?.minParticipants || 0;
  const progressPercent = targetCount > 0 ? Math.round((joinedCount / targetCount) * 100) : 0;
  
  const imageUri = product?.imageUrl?.startsWith('http') 
    ? product.imageUrl 
    : `${API_BASE_URL}/api/products/images/${product?.imageUrl}`;

  const handleActionPress = async () => {
    if (!token) {
      Alert.alert("Login Required", "Please log in to participate.", [{ text: "Cancel" }, { text: "Login", onPress: () => router.push('/login' as any) }]);
      return;
    }

    if (!activeGroup) return;

    if (isJoined) {
      Alert.alert(
        "Leave Group",
        "Are you sure you want to leave this group? Your pre-authorization will be cancelled.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Leave", 
            style: "destructive",
            onPress: async () => {
              setActionLoading(true);
              const success = await leaveGroup(activeGroup.id);
              setActionLoading(false);
              if (success) {
                Alert.alert("Success", "You have left the group.");
                // רענון המוצר כדי לעדכן מונה משתתפים ב-UI
                const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
                if (response.ok) setProduct(await response.json());
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Join Group",
        `Authorize ₪1 to join "${product.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Confirm", 
            onPress: async () => {
              setActionLoading(true);
              const success = await joinGroup(activeGroup.id);
              setActionLoading(false);
              if (success) {
                Alert.alert("Success!", "You have joined the group.");
                router.replace('/(tabs)/groups' as any); 
              }
            }
          }
        ]
      );
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#228be6" /></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{product?.name}</Text>
          
          <View style={styles.priceBlock}>
            <View>
              <Text style={styles.label}>Team Price</Text>
              <Text style={styles.groupPrice}>₪{product?.price_group || product?.price}</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.label}>Regular Price</Text>
              <Text style={styles.regularPrice}>₪{product?.price_regular || (Number(product?.price) * 1.2).toFixed(0)}</Text>
            </View>
          </View>

          {activeGroup ? (
            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Current Progress</Text>
                <Text style={styles.progressValue}>
                  <Text style={{fontWeight: 'bold', color: '#228be6'}}>{joinedCount}</Text>/{targetCount} joined
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
              </View>
            </View>
          ) : (
            <View style={styles.noGroupBanner}>
              <Text style={styles.noGroupText}>No active power group for this item</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product?.description}</Text>
        </View>
      </ScrollView>

      <View style={[styles.customHeader, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => toggleWishlist(productId)}><Ionicons name={isInWishlist ? "heart" : "heart-outline"} size={24} color={isInWishlist ? "#ef4444" : "#333"} /></TouchableOpacity>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerLabel}>PayPal Pre-auth</Text>
            <Text style={styles.footerPrice}>₪1</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.joinButton, 
              !activeGroup && styles.disabledButton,
              isJoined && styles.leaveButton
            ]} 
            onPress={handleActionPress}
            disabled={!activeGroup || actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinButtonText}>
                {!activeGroup ? "No Group" : isJoined ? "Leave Group" : "Join Group"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  customHeader: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255, 0.9)', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  imageContainer: { width: width, height: 380, backgroundColor: '#f3f4f6' },
  image: { width: '100%', height: '100%' },
  content: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 16 },
  priceBlock: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 20, marginBottom: 24 },
  divider: { width: 1, height: 40, backgroundColor: '#e2e8f0', marginHorizontal: 20 },
  label: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  groupPrice: { fontSize: 24, fontWeight: '900', color: '#228be6' },
  regularPrice: { fontSize: 18, color: '#94a3b8', textDecorationLine: 'line-through' },
  progressSection: { marginBottom: 24 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: '700', color: '#334155' },
  progressValue: { fontSize: 14, color: '#64748b' },
  progressBarBg: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#228be6', borderRadius: 5 },
  noGroupBanner: { padding: 15, backgroundColor: '#fff1f0', borderRadius: 12, marginBottom: 20 },
  noGroupText: { color: '#cf1322', textAlign: 'center', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 24, color: '#475569' },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 12 },
  footerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  footerLabel: { fontSize: 11, color: '#94a3b8' },
  footerPrice: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  joinButton: { backgroundColor: '#228be6', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, minWidth: 150, alignItems: 'center' },
  leaveButton: { backgroundColor: '#ef4444' },
  disabledButton: { backgroundColor: '#cbd5e1' },
  joinButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});