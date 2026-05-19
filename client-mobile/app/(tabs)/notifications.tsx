import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { API_BASE_URL } from '../../src/config/api';

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { token } = useStore();

  useEffect(() => {
    if (token) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/notifications/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Notifications fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to remove this notification?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
              }
            } catch (err) {
              console.error("Delete error:", err);
            }
          }
        }
      ]
    );
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'GROUP_JOIN': return 'person-add-outline';
      case 'GROUP_COMPLETED': return 'checkmark-done-circle-outline';
      case 'GROUP_THRESHOLD': return 'flame-outline';
      case 'GROUP_LEAVE': return 'exit-outline';
      default: return 'notifications-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#228be6" />
      </View>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="notifications-off-outline" size={80} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>Log in to see notifications</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login' as any)}>
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[styles.notifCard, !item.isRead && styles.unreadCard]}>
            <TouchableOpacity 
              style={styles.contentTouchable} 
              onPress={() => !item.isRead && handleMarkAsRead(item.id)}
            >
              <View style={[styles.iconContainer, !item.isRead && styles.unreadIconContainer]}>
                <Ionicons 
                  name={getIconName(item.type)} 
                  size={22} 
                  color={item.isRead ? "#94a3b8" : "#228be6"} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.notifType, !item.isRead && styles.unreadText]}>
                  {item.type.replace(/_/g, ' ')}
                </Text>
                <Text style={styles.notifMessage} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.notifDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleDelete(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={18} color="#cbd5e1" />
            </TouchableOpacity>
            
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={60} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              We'll notify you about your joined groups and deals.
            </Text>
            <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/')}>
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
  header: { padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  listContent: { paddingBottom: 20, flexGrow: 1 },
  notifCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    position: 'relative'
  },
  unreadCard: { backgroundColor: '#f0f9ff' },
  contentTouchable: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#f8fafc', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  unreadIconContainer: { backgroundColor: '#e0f2fe' },
  textContainer: { flex: 1, paddingRight: 10 },
  notifType: { fontSize: 14, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  unreadText: { color: '#0369a1' },
  notifMessage: { fontSize: 15, color: '#334155', lineHeight: 20 },
  notifDate: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  unreadDot: { 
    position: 'absolute',
    top: 20,
    left: 12,
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#228be6' 
  },
  deleteButton: { padding: 10 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 100 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptySubtitle: { fontSize: 16, color: '#9ca3af', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  browseButton: { backgroundColor: '#228be6', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' },
  browseButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loginButton: { backgroundColor: '#228be6', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 20 },
  loginButtonText: { color: '#fff', fontWeight: 'bold' }
});