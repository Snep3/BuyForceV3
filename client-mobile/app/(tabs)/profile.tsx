import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { API_BASE_URL } from '../../src/config/api';
import { getTheme } from '../../src/theme';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  completed:  { bg: '#ebfbee', color: '#2f9e44' },
  pending:    { bg: '#e7f5ff', color: '#228be6' },
  cancelled:  { bg: '#fff5f5', color: '#fa5252' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { token, user, logout, isDark, toggleTheme } = useStore();
  const t = getTheme(isDark);

  const [profile, setProfile]   = useState<any>(null);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  const [groupsOpen, setGroupsOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', avatarUrl: '' });

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    void loadData();
  }, [token]);

  useEffect(() => {
    if (!form.avatarUrl.startsWith('https://ui-avatars.com')) return;
    const name = form.fullName || profile?.username || 'User';
    setForm(f => ({ ...f, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=228be6&color=fff&size=200` }));
  }, [form.fullName]);

  const loadData = async () => {
    try {
      const [userRes, groupsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/me`,    { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/groups/my`,   { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/orders/my`,   { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (userRes.ok) {
        const u = await userRes.json();
        setProfile(u);
        setForm({ fullName: u.fullName || '', phone: u.phone || '', address: u.address || '', avatarUrl: u.avatarUrl || '' });
      }
      if (groupsRes.ok) setMyGroups(await groupsRes.json());
      if (ordersRes.ok) setMyOrders(await ordersRes.json());
    } catch {
      // show whatever we have from store
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const original = {
      fullName:  profile?.fullName  || '',
      phone:     profile?.phone     || '',
      address:   profile?.address   || '',
      avatarUrl: profile?.avatarUrl || '',
    };
    const changes = Object.fromEntries(
      Object.entries(form)
        .filter(([k, v]) => v !== original[k as keyof typeof original])
        .map(([k, v]) => [k, k === 'avatarUrl' && v === '' ? null : v])
    );
    if (Object.keys(changes).length === 0) { setIsEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to save');
      }
      setProfile((prev: any) => ({ ...prev, ...changes }));
      setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v == null ? '' : v])) }));
      setIsEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.guestTitle}>You're not logged in</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#228be6" /></View>;

  const displayName  = profile?.fullName || profile?.username || user?.fullName || user?.username || 'User';
  const email        = profile?.email || user?.email || '';
  const initials     = displayName.slice(0, 2).toUpperCase();
  const memberYear   = profile?.createdAt ? new Date(profile.createdAt).getFullYear() : null;
  const filteredGroups = myGroups.filter(g =>
    g.name?.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const filteredOrders = myOrders.filter(order => {
    const q = orderSearch.toLowerCase();
    return order.items?.some((it: any) => it.product?.name?.toLowerCase().includes(q));
  });

  const activeGroups    = myGroups.filter(g => !g.isCompleted).length;
  const completedGroups = myGroups.filter(g => g.isCompleted).length;

  const stats = [
    { label: 'Groups Joined', value: myGroups.length },
    { label: 'Active',        value: activeGroups },
    { label: 'Completed',     value: completedGroups },
  ];

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: t.bg }]}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={120}
    >

      {/* ── Profile Card ── */}
      <View style={[styles.card, { backgroundColor: t.card }]}>
        <LinearGradient colors={['#228be6', '#15aabf']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover} />

        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: t.text }]}>{displayName}</Text>
            <Text style={[styles.userEmail, { color: t.subtext }]}>{email}{memberYear ? ` · Member since ${memberYear}` : ''}</Text>
            {profile?.phone   && <Text style={[styles.userMeta, { color: t.text }]}>📞 {profile.phone}</Text>}
            {profile?.address && <Text style={[styles.userMeta, { color: t.text }]}>📍 {profile.address}</Text>}
            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(e => !e)}>
              <Text style={styles.editBtnText}>{isEditing ? 'Cancel' : 'Edit Profile'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={s.label} style={[styles.statCell, i < 2 && styles.statDivider]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {isEditing && (
          <View style={[styles.editForm, { borderTopColor: t.border }]}>
            {[
              { label: 'Full Name',  key: 'fullName',  placeholder: 'Your full name' },
              { label: 'Phone',      key: 'phone',     placeholder: '+1 234 567 8900' },
              { label: 'Address',    key: 'address',   placeholder: 'Your address' },
              { label: 'Avatar URL', key: 'avatarUrl', placeholder: 'https://...' },
            ].map(({ label, key, placeholder }) => (
              <View key={key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
                  value={form[key as keyof typeof form]}
                  onChangeText={t => setForm(f => ({ ...f, [key]: t }))}
                  placeholder={placeholder}
                  placeholderTextColor={t.placeholder}
                  autoCapitalize="none"
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.resetPicBtn}
              onPress={() => setForm(f => ({ ...f, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=228be6&color=fff&size=200` }))}
            >
              <Ionicons name="person-circle-outline" size={15} color="#228be6" />
              <Text style={styles.resetPicText}>Reset Profile Picture</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── My Groups (collapsible) ── */}
      <View style={[styles.section, { backgroundColor: t.card }]}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => setGroupsOpen(o => !o)} activeOpacity={0.7}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>My Groups Activity</Text>
          <Ionicons name={groupsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={t.subtext} />
        </TouchableOpacity>

        {groupsOpen && (
          myGroups.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>You haven't joined any groups yet.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.emptyBtnText}>Browse Active Deals</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sectionBody}>
              <View style={[styles.searchBox, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                <Ionicons name="search" size={15} color={t.placeholder} />
                <TextInput
                  style={[styles.searchInput, { color: t.text }]}
                  placeholder="Search groups..."
                  placeholderTextColor={t.placeholder}
                  value={groupSearch}
                  onChangeText={setGroupSearch}
                />
                {groupSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setGroupSearch('')}>
                    <Ionicons name="close-circle" size={16} color={t.placeholder} />
                  </TouchableOpacity>
                )}
              </View>
              {filteredGroups.length === 0 ? (
                <Text style={[styles.emptyText, { paddingVertical: 16 }]}>No groups match "{groupSearch}"</Text>
              ) : filteredGroups.map(group => {
                const pct = Math.min(group.progress ?? 0, 100);
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupRow}
                    onPress={() => group.productId && router.push(`/product/${group.productId}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.groupRowTop}>
                      <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                      <View style={[styles.badge, { backgroundColor: group.isCompleted ? '#ebfbee' : '#e7f5ff' }]}>
                        <Text style={[styles.badgeText, { color: group.isCompleted ? '#2f9e44' : '#228be6' }]}>
                          {group.isCompleted ? 'Completed' : 'Active'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: group.isCompleted ? '#20c997' : '#228be6' }]} />
                    </View>
                    <View style={styles.groupRowBottom}>
                      <Text style={styles.groupMeta}>{group.currentParticipants}/{group.minParticipants} members</Text>
                      <Text style={[styles.groupPct, { color: group.isCompleted ? '#20c997' : '#228be6' }]}>{pct}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        )}
      </View>

      {/* ── Recent Orders (collapsible) ── */}
      <View style={[styles.section, { backgroundColor: t.card }]}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => setOrdersOpen(o => !o)} activeOpacity={0.7}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Recent Orders</Text>
          <Ionicons name={ordersOpen ? 'chevron-up' : 'chevron-down'} size={20} color={t.subtext} />
        </TouchableOpacity>

        {ordersOpen && (
          myOrders.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No orders yet.</Text>
            </View>
          ) : (
            <View style={styles.sectionBody}>
              <View style={[styles.searchBox, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
                <Ionicons name="search" size={15} color={t.placeholder} />
                <TextInput
                  style={[styles.searchInput, { color: t.text }]}
                  placeholder="Search orders..."
                  placeholderTextColor={t.placeholder}
                  value={orderSearch}
                  onChangeText={setOrderSearch}
                />
                {orderSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setOrderSearch('')}>
                    <Ionicons name="close-circle" size={16} color={t.placeholder} />
                  </TouchableOpacity>
                )}
              </View>
              {filteredOrders.length === 0 ? (
                <Text style={[styles.emptyText, { paddingVertical: 16 }]}>No orders match "{orderSearch}"</Text>
              ) : filteredOrders.slice(0, 10).map(order => {
                const productNames = order.items?.length
                  ? order.items.map((it: any) => `${it.product?.name || 'Unknown'}${it.quantity > 1 ? ` ×${it.quantity}` : ''}`).join(', ')
                  : '—';
                const sc = STATUS_COLORS[order.status] ?? { bg: '#f1f3f5', color: '#868e96' };
                return (
                  <View key={order.id} style={styles.orderRow}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderName} numberOfLines={1}>{productNames}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.badgeText, { color: sc.color }]}>{order.status}</Text>
                    </View>
                    <Text style={styles.orderPrice}>₪{Number(order.totalPrice).toLocaleString()}</Text>
                  </View>
                );
              })}
            </View>
          )
        )}
      </View>

      {/* ── Dark Mode Toggle ── */}
      <TouchableOpacity style={[styles.themeToggleBtn, { backgroundColor: t.card }]} onPress={toggleTheme}>
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={isDark ? '#f59f00' : '#228be6'} />
        <Text style={[styles.themeToggleText, { color: t.text }]}>{isDark ? 'Light Mode' : 'Dark Mode'}</Text>
        <View style={[styles.themeToggleSwitch, { backgroundColor: isDark ? '#228be6' : t.border }]}>
          <View style={[styles.themeToggleKnob, { left: isDark ? 18 : 2 }]} />
        </View>
      </TouchableOpacity>

      {/* ── Logout ── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  scroll:    { padding: 20, paddingBottom: 40 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },

  // Profile card
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 24, elevation: 4, marginBottom: 16 },
  cover: { height: 120 },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 20, marginTop: -50, gap: 14 },
  avatarWrap: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { width: '100%', height: '100%', backgroundColor: '#228be6', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 28, fontWeight: '900', color: '#fff' },
  userInfo: { flex: 1, paddingBottom: 4 },
  userName:  { fontSize: 20, fontWeight: '900', color: '#1a1a1a', marginBottom: 3 },
  userEmail: { fontSize: 13, color: '#868e96' },
  userMeta:  { fontSize: 13, color: '#495057', marginTop: 4 },
  statsRow:  { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  statCell:  { flex: 1, paddingVertical: 18, alignItems: 'center' },
  statDivider: { borderRightWidth: 1, borderRightColor: '#f0f0f0' },
  statValue: { fontSize: 26, fontWeight: '900', color: '#228be6', marginBottom: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#868e96', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  editBtn:     { marginTop: 10, paddingVertical: 7, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#dee2e6', alignSelf: 'flex-start' },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#228be6' },

  editForm:   { borderTopWidth: 1, borderTopColor: '#f0f0f0', padding: 20, gap: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#868e96', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: { borderWidth: 1.5, borderColor: '#dee2e6', borderRadius: 10, padding: 12, fontSize: 15, color: '#111' },
  resetPicBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1.5, borderColor: '#d0ebff', backgroundColor: '#e7f5ff', alignSelf: 'flex-start' },
  resetPicText: { fontSize: 13, fontWeight: '700', color: '#228be6' },
  saveBtn:    { backgroundColor: '#228be6', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText:{ color: '#fff', fontWeight: '800', fontSize: 15 },

  // Collapsible sections
  section:       { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  sectionTitle:  { fontSize: 15, fontWeight: '900', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBody:   { paddingHorizontal: 16, paddingBottom: 12 },

  // Groups
  groupRow:    { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, marginBottom: 10 },
  groupRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  groupName:   { fontSize: 14, fontWeight: '800', color: '#1a1a1a', flex: 1, marginRight: 8 },
  progressBg:  { height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill:{ height: '100%', borderRadius: 4 },
  groupRowBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  groupMeta:   { fontSize: 12, color: '#868e96' },
  groupPct:    { fontSize: 12, fontWeight: '700' },

  // Orders
  orderRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 10 },
  orderInfo:   { flex: 1 },
  orderName:   { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  orderDate:   { fontSize: 12, color: '#adb5bd' },
  orderPrice:  { fontSize: 15, fontWeight: '800', color: '#228be6', minWidth: 60, textAlign: 'right' },

  // Shared
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#212529' },

  emptySection: { padding: 20, alignItems: 'center', gap: 12 },
  emptyText:    { color: '#adb5bd', fontSize: 14, fontStyle: 'italic' },
  emptyBtn:     { backgroundColor: '#228be6', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  themeToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  themeToggleText: { flex: 1, fontSize: 15, fontWeight: '700' },
  themeToggleSwitch: { width: 40, height: 24, borderRadius: 12, justifyContent: 'center' },
  themeToggleKnob: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  logoutBtn:  { borderRadius: 12, borderWidth: 1.5, borderColor: '#fa5252', paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  logoutText: { color: '#fa5252', fontWeight: '800', fontSize: 15 },

  guestTitle:    { fontSize: 18, fontWeight: '700', color: '#495057' },
  loginBtn:      { backgroundColor: '#228be6', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
  loginBtnText:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});
