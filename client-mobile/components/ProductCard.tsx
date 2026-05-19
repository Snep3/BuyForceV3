import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { getTheme } from '../src/theme';
import { API_BASE_URL } from '../src/config/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface ProductCardProps {
  id: string;
  title: string;
  regularPrice: number;
  groupPrice: number;
  joinedCount: number;
  targetCount: number;
  progress: number;
  image: string | any;
  endsAt?: string;
  showGroupInfo?: boolean;
}

export default function ProductCard({
  id,
  title,
  regularPrice,
  groupPrice,
  joinedCount,
  targetCount,
  progress,
  image,
  endsAt,
  showGroupInfo = true,
}: ProductCardProps) {
  const router = useRouter();
  const isDark = useStore(s => s.isDark);
  const t = getTheme(isDark);

  const getTimeLeft = (deadline: string) => {
    if (!deadline) return '';
    const total = Date.parse(deadline) - Date.now();
    if (total <= 0) return 'Ended';
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days}d left`;
    return `${hours}h left`;
  };

  const imageSource =
    typeof image === 'string'
      ? image.startsWith('http')
        ? { uri: image }
        : { uri: `${API_BASE_URL}/api/products/images/${image}` }
      : image;

  const pct = Math.min(progress || 0, 100);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}
      onPress={() => router.push(`/product/${id}`)}
      activeOpacity={0.85}
    >
      <View style={[styles.imageContainer, { backgroundColor: isDark ? '#272932' : '#f8f9fa' }]}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        {showGroupInfo && endsAt && (
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>{getTimeLeft(endsAt)}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: t.text }]} numberOfLines={2}>{title}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.groupPrice}>₪{groupPrice}</Text>
          <Text style={styles.regularPrice}>₪{regularPrice}</Text>
        </View>

        {showGroupInfo && (
          <>
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#33363f' : '#e9ecef' }]}>
              <View style={[styles.progressBarFill, { width: `${pct}%` as any }]} />
            </View>
            <View style={styles.statsRow}>
              <Text style={[styles.statsText, { color: t.subtext }]}>{joinedCount}/{targetCount} joined</Text>
              <Text style={[styles.percentageText, { color: t.subtext }]}>{Math.round(pct)}%</Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: { height: 140, width: '100%' },
  image: { width: '100%', height: '100%' },
  timeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  content: { padding: 10 },
  title: { fontSize: 13, fontWeight: '700', marginBottom: 6, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  groupPrice: { fontSize: 16, fontWeight: '800', color: '#228be6' },
  regularPrice: { fontSize: 11, color: '#adb5bd', textDecorationLine: 'line-through' },
  progressBarBg: { height: 6, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#228be6', borderRadius: 3 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statsText: { fontSize: 10 },
  percentageText: { fontSize: 10, fontWeight: '700' },
});
