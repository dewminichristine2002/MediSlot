// src/screens/NotificationsScreen.js
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../api/config';

const C = {
  bg: '#F9FAFB',
  card: '#FFFFFF',
  text: '#0F172A',
  sub: '#475569',
  border: '#E5E7EB',
  g1: '#2563EB', // blue
  g2: '#06B6D4', // cyan
  g3: '#10B981', // emerald
  primary: '#2563EB',
  info: '#0EA5A6',
  warn: '#F59E0B',
  danger: '#EF4444',
};

function shadow(elev = 4) {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elev / 2 },
      shadowOpacity: 0.08,
      shadowRadius: elev,
    },
    android: { elevation: elev },
    default: {},
  });
}

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

const messageType = (msg = '') => {
  const s = String(msg).toLowerCase();
  if (/lab\s*(report|result)|report\s*is\s*ready/.test(s)) {
    return { key: 'lab', icon: 'flask-outline', accent: C.g3 };
  }
  if (/event|camp|booking|slot/.test(s)) {
    return { key: 'event', icon: 'calendar-outline', accent: C.primary };
  }
  if (/warning|delay|change/.test(s)) {
    return { key: 'warn', icon: 'alert-circle-outline', accent: C.warn };
  }
  return { key: 'generic', icon: 'notifications-outline', accent: C.sub };
};

export default function NotificationsScreen({ navigation }) {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const storageKey = user?._id ? `notif_last_seen_${user._id}` : null;

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation.getState()?.routeNames?.includes('Home')) {
      navigation.navigate('Home');
    }
  }, [navigation]);

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const lastSeenStr = storageKey ? await AsyncStorage.getItem(storageKey) : null;
      const lastSeen = lastSeenStr ? Number(lastSeenStr) : 0;

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

      const decorated = sorted.map((n) => ({
        ...n,
        _ts: new Date(n.sent_at).getTime(),
        _isNew: lastSeen ? new Date(n.sent_at).getTime() > lastSeen : true,
      }));

      setItems(decorated);

      if (storageKey) {
        const latestTs = decorated.length ? decorated[0]._ts : Date.now();
        await AsyncStorage.setItem(storageKey, String(latestTs));
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e.message);
      setItems([]);
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

  const handlePress = (item) => {
    const t = messageType(item?.message).key;
    if (t === 'lab') {
      navigation.navigate('Profile', { openLab: true });
      return;
    }
    if (t === 'event') {
      navigation.navigate('FreeEventsTab', { screen: 'FreeEvents' });
      return;
    }
  };

  const renderItem = ({ item }) => {
    const mt = messageType(item?.message);
    return (
      <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardOutline}>
        <Pressable
          onPress={() => handlePress(item)}
          style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }]}
        >
          {item._isNew ? <View style={[styles.newDot, { backgroundColor: mt.accent }]} /> : null}

          <View style={[styles.iconWrap, { borderColor: '#E6EEF9' }]}>
            <Ionicons name={mt.icon} size={20} color={mt.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.msg}>{item.message}</Text>
            <Text style={styles.meta}>{formatWhen(item.sent_at)}</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={C.sub} />
        </Pressable>
      </LinearGradient>
    );
  };

  /* ---- UI ---- */
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={10} style={styles.headerBack}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>Health updates & reports</Text>
        </LinearGradient>

        <View style={styles.center}>
          <ActivityIndicator color={C.primary} />
          <Text style={{ marginTop: 8, color: C.sub, fontWeight: '600' }}>Loading notifications…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!items.length) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={10} style={styles.headerBack}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>You’re all caught up</Text>
        </LinearGradient>

        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={48} color={C.sub} />
          <Text style={{ marginTop: 10, fontWeight: '800', color: C.text }}>No notifications</Text>
          <Text style={{ marginTop: 4, color: C.sub, textAlign: 'center', paddingHorizontal: 24 }}>
            You’ll see lab report and event updates here.
          </Text>

          <Pressable onPress={onRefresh} style={{ borderRadius: 12, overflow: 'hidden', marginTop: 14 }}>
            <LinearGradient
              colors={[C.g1, C.g3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Refresh</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const newCount = items.filter((i) => i._isNew).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={10} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSub}>
          {newCount > 0 ? `${newCount} new update${newCount > 1 ? 's' : ''}` : 'Up to date'}
        </Text>
      </LinearGradient>

      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(it) => it._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
      />
    </SafeAreaView>
  );
}

const R = 16;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -60,
    ...shadow(4),
  },
  headerBack: {
    position: 'absolute',
    left: 12,
    top: 40,
    zIndex: 10,
    marginTop: 65,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginTop: 70,marginLeft: '40', },
  headerSub: { color: 'rgba(255,255,255,0.92)', marginTop: 6, fontWeight: '700',marginLeft: '40', },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  list: { padding: 16, paddingBottom: 28 },

  cardOutline: {
    borderRadius: R + 2,
    padding: 1.5,
    marginBottom: 12,
    ...shadow(3),
  },
  card: {
    backgroundColor: C.card,
    borderRadius: R,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 2,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  msg: { fontSize: 15, fontWeight: '700', color: C.text },
  meta: { marginTop: 2, fontSize: 12, color: C.sub },
});
