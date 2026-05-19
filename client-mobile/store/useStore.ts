import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../src/config/api';

interface AppState {
  wishlistIds: string[];
  joinedGroupIds: string[];
  isLoggedIn: boolean;
  token: string | null;
  user: any | null;
  isDark: boolean;
  unreadCount: number;

  // Actions
  fetchWishlist: () => Promise<void>;
  fetchJoinedGroups: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  toggleWishlist: (id: string, isGroup?: boolean) => Promise<void>;
  isWishlisted: (id: string) => boolean;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  hasJoined: (groupId: string) => boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  toggleTheme: () => void;
  updateUser: (changes: Partial<any>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      wishlistIds: [],
      joinedGroupIds: [],
      isLoggedIn: false,
      token: null,
      user: null,
      isDark: false,
      unreadCount: 0,

      fetchUnreadCount: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE_URL}/api/notifications/my`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            set({ unreadCount: data.filter((n: any) => !n.isRead).length });
          }
        } catch {}
      },

      fetchWishlist: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE_URL}/api/wishlist`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const ids = data.map((item: any) => item.productId || item.groupId).filter(Boolean);
            set({ wishlistIds: ids });
          }
        } catch (error) {
          console.error("Fetch wishlist error:", error);
        }
      },

      fetchJoinedGroups: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE_URL}/api/groups/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            set({ joinedGroupIds: data.map((g: any) => g.id) });
          }
        } catch (error) {
          console.error("Fetch groups error:", error);
        }
      },

      isWishlisted: (id) => get().wishlistIds.includes(id),
      hasJoined: (groupId) => get().joinedGroupIds.includes(groupId),

      toggleWishlist: async (id, isGroup = false) => {
        const { token, wishlistIds, fetchWishlist } = get();
        if (!token) return;

        const exists = wishlistIds.includes(id);
        const updatedIds = exists 
          ? wishlistIds.filter(item => item !== id) 
          : [...wishlistIds, id];
        set({ wishlistIds: updatedIds });

        try {
          const url = exists 
            ? `${API_BASE_URL}/api/wishlist/remove/${id}` 
            : `${API_BASE_URL}/api/wishlist/add`;

          const res = await fetch(url, {
            method: exists ? 'DELETE' : 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json' 
            },
            body: exists ? undefined : JSON.stringify(isGroup ? { groupId: id } : { productId: id })
          });

          if (!res.ok) throw new Error("Sync failed");
          await fetchWishlist();
        } catch (error) {
          set({ wishlistIds });
          console.error("Wishlist sync error:", error);
        }
      },

      joinGroup: async (groupId) => {
        const { token, fetchJoinedGroups, joinedGroupIds } = get();
        if (!token) return false;

        try {
          const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
            // עדכון מקומי מהיר
            set({ joinedGroupIds: [...joinedGroupIds, groupId] });
            await fetchJoinedGroups();
            return true;
          }
          return false;
        } catch (error) {
          console.error("Join error:", error);
          return false;
        }
      },

      leaveGroup: async (groupId) => {
        const { token, fetchJoinedGroups, joinedGroupIds } = get();
        if (!token) return false;

        try {
          const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/join`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
            // עדכון מקומי מהיר - הסרת ה-ID מהרשימה מיד
            set({ joinedGroupIds: joinedGroupIds.filter(id => id !== groupId) });
            await fetchJoinedGroups(); 
            return true;
          }
          return false;
        } catch (error) {
          console.error("Leave error:", error);
          return false;
        }
      },

      login: (token, user) => {
        set({ isLoggedIn: true, token, user });
        get().fetchWishlist();
        get().fetchJoinedGroups();
        get().fetchUnreadCount();
      },

      logout: () => set({
        isLoggedIn: false,
        token: null,
        user: null,
        wishlistIds: [],
        joinedGroupIds: [],
        unreadCount: 0,
      }),

      toggleTheme: () => set(s => ({ isDark: !s.isDark })),
      updateUser: (changes) => set(s => ({ user: { ...s.user, ...changes } })),
    }),
    {
      name: 'buyforce-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);