import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../api/config';

function formatWhen(d) {
  try {
    const dt = new Date(d);
    const now = new Date();
    const diffMs = now - dt;
    const s = Math.floor(diffMs / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d2 = Math.floor(h / 24);
    if (s < 60) return 'Just now';
    if (m < 60) return `${m} min${m > 1 ? 's' : ''} ago`;
    if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
    if (d2 < 7) return `${d2} day${d2 > 1 ? 's' : ''} ago`;
    return dt.toDateString();
  } catch {
    return '';
  }
}

export default function NotificationsScreen({ navigation }) {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const storageKey = user?._id ? `notif_last_seen_${user._id}` : null;

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/eventLabNotifications?user_id=${user._id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
        : [];
      setItems(sorted);

      // Mark as seen: set lastSeen to latest sent_at (or now if none)
      if (storageKey) {
        const latestTs = sorted.length
          ? new Date(sorted[0].sent_at).getTime()
          : Date.now();
        await AsyncStorage.setItem(storageKey, String(latestTs));
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e.message);
      setItems([]);
      // still mark seen to now so badge clears even if list fails
      if (storageKey) await AsyncStorage.setItem(storageKey, String(Date.now()));
    } finally {
      setLoading(false);
    }
  }, [user?._id, token, storageKey]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const isLabResultMsg = (msg = '') =>
    /lab\s*report|report\s*is\s*ready/i.test(msg);

  const handlePress = (item) => {
    if (isLabResultMsg(item?.message)) {
      navigation.navigate('Profile', { openLab: true });
      return;
    }
  };

  const renderItem = ({ item }) => (
    <Pressable onPress={() => handlePress(item)} style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="notifications" size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.msg}>{item.message}</Text>
        <Text style={styles.meta}>{formatWhen(item.sent_at)}</Text>
      </View>
      <View style={styles.chev}>
        <Ionicons name="chevron-forward" size={20} />
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading notifications…</Text>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={styles.center}>
        <Ionicons name="notifications-off-outline" size={44} />
        <Text style={{ marginTop: 8, fontWeight: '600' }}>No notifications</Text>
        <Text style={{ marginTop: 4, color: '#6b7280', textAlign: 'center' }}>
          You’ll see lab report and event updates here.
        </Text>
        <Pressable style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(it) => it._id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  msg: { fontSize: 15, fontWeight: '600' },
  meta: { marginTop: 2, fontSize: 12, color: '#6b7280' },
  chev: { paddingLeft: 8, paddingVertical: 6, paddingRight: 0 },
  refreshBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  refreshText: { fontWeight: '600' },
});
