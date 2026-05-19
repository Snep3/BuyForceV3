import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { API_BASE_URL } from '../src/config/api';
import { getTheme } from '../src/theme';

export default function CustomHeader() {
  const router = useRouter();
  const { user, isLoggedIn, isDark } = useStore();
  const t = getTheme(isDark);
  const insets = useSafeAreaInsets();

  const avatarUri = user?.avatarUrl
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_BASE_URL}/api/products/images/${user.avatarUrl}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.username || 'U')}&background=228be6&color=fff&bold=true`;

  return (
    <View style={[styles.safeArea, { backgroundColor: t.card, borderBottomColor: t.border, paddingTop: insets.top }]}>
      <View style={styles.container}>
        <Text style={[styles.logo, { color: t.text }]}>
          <Text style={styles.logoAccent}>Buy</Text>Force
        </Text>

        <TouchableOpacity
          onPress={() => router.push(isLoggedIn ? '/(tabs)/profile' : '/(auth)/login')}
          style={styles.avatarButton}
        >
          {isLoggedIn ? (
            <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: t.border }]} />
          ) : (
            <View style={styles.loginBtn}>
              <Text style={styles.loginBtnText}>Sign In</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#228be6',
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
  },
  loginBtn: {
    backgroundColor: '#228be6',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
