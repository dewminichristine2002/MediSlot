// src/screens/HomeScreen.js
import React, { useLayoutEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Button,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../api/config';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
  const { user, token, signOut } = useAuth();
  const [notifCount, setNotifCount] = useState(0);
  const pollingRef = useRef(null);

  const storageKey = user?._id ? `notif_last_seen_${user._id}` : null;
  const role = (user?.user_category || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'manager';

  const canGoTo = useCallback(
    (routeName) => navigation.getState()?.routeNames?.includes(routeName),
    [navigation]
  );

  const goLogin = useCallback(() => {
    if (canGoTo('Login')) navigation.navigate('Login');
    else Alert.alert('Login not available', 'Please log out first.');
  }, [navigation, canGoTo]);

  const goProfile = useCallback(() => {
    if (canGoTo('Profile')) navigation.navigate('Profile');
  }, [navigation, canGoTo]);

  // Mark all notifications as seen (now) for this user
  const markNotifSeen = useCallback(async () => {
    try {
      if (storageKey) {
        await AsyncStorage.setItem(storageKey, String(Date.now()));
      }
    } catch (e) {
      console.warn('Failed to mark notifications seen:', e?.message);
    }
  }, [storageKey]);

  const goNotifications = useCallback(async () => {
    // Clear badge immediately for better UX, then navigate
    await markNotifSeen();
    setNotifCount(0);
    if (canGoTo('Notifications')) navigation.navigate('Notifications');
  }, [navigation, canGoTo, markNotifSeen]);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut() },
    ]);
  }, [signOut]);

  // ---- Fetch notification count ----
  const fetchNotifCount = useCallback(async () => {
    try {
      if (!user?._id || isAdmin) {
        setNotifCount(0);
        return;
      }
      const base = getApiBaseUrl();
      const url = `${base}/api/eventLabNotifications?user_id=${user._id}`;

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = await res.json();
      const list = Array.isArray(items) ? items : [];

      let lastSeen = 0;
      if (storageKey) {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) lastSeen = Number(raw) || 0;
      }

      const unseen = list.filter((n) => {
        const t = n?.sent_at ? new Date(n.sent_at).getTime() : 0;
        return t > lastSeen;
      }).length;

      setNotifCount(unseen);
    } catch (e) {
      console.warn('Failed to fetch notifications:', e.message);
    }
  }, [user?._id, token, storageKey, isAdmin]);

  // Refresh on focus + polling
  useFocusEffect(
    useCallback(() => {
      fetchNotifCount();
      if (user && !isAdmin) {
        pollingRef.current = setInterval(fetchNotifCount, 30000);
      }
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }, [fetchNotifCount, user, isAdmin])
  );

  // ---- Gradient Header ----
  useLayoutEffect(() => {
    const firstName = (user?.name || '').split(' ')[0] || 'Welcome';

    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text style={styles.hTitle}>MediSlot</Text>
          <Text style={styles.hSub}>
            {user ? `Hi, ${firstName}` : 'Your health companion'}
          </Text>
        </View>
      ),
      headerTitleAlign: 'left',
      headerTintColor: '#fff',
      headerShadowVisible: false,
      headerStyle: { backgroundColor: 'transparent' },
      headerBackground: () => (
        <LinearGradient
          colors={['#2563EB', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ),
      // ⭐ Only show buttons if user is logged in
      headerRight: () =>
        user ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!isAdmin && (
              <Pressable onPress={goNotifications} hitSlop={10} style={{ marginRight: 14 }}>
                {/* Icon wrapper guarantees a positioned parent for the badge */}
                <View style={styles.iconWrap}>
                  <Ionicons name="notifications-outline" size={26} color="#131111ff" />
                  {notifCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {notifCount > 99 ? '99+' : String(notifCount)}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )}
            <Pressable onPress={goProfile} hitSlop={10}>
              <Ionicons name="person-circle-outline" size={28} color="#131111ff" />
            </Pressable>
            <Pressable onPress={handleLogout} hitSlop={10} style={{ marginLeft: 14 }}>
              <Ionicons name="log-out-outline" size={26} color="#131111ff" />
            </Pressable>
          </View>
        ) : null,
    });
  }, [navigation, user, notifCount, isAdmin, goProfile, handleLogout, goNotifications]);

  // --- UI ---
  if (user && isAdmin) {
    const initials =
      (user?.name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join('') || 'U';

    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Admin hero */}
        <LinearGradient colors={['#2563EB', '#06B6D4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>Admin Dashboard</Text>
              <Text style={styles.heroSub}>
                {`Welcome ${user?.name || ''}`.trim()} • {(user?.user_category || 'Admin')}
              </Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick action - only Scan QR */}
        <View style={styles.quickWrap}>
          <Text style={styles.sectionTitle}>Quick Action</Text>
          <ActionTile
            title="Scan QR"
            icon="qr-code-outline"
            gradient={['#2563EB', '#06B6D4']}
            onPress={() => navigation.navigate('AdminScan')}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      {!user && <Button title="Go to Login" onPress={goLogin} />}
      {user && !isAdmin && <Text style={styles.welcome}>Welcome back 👋</Text>}
    </View>
  );
}

/* ------- Small component ------- */
function ActionTile({ title, icon, gradient, onPress }) {
  return (
    <TouchableOpacity style={styles.tile} activeOpacity={0.92} onPress={onPress}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tileFill}>
        <Ionicons name={icon} size={26} color="#fff" />
      </LinearGradient>
      <Text style={styles.tileText}>{title}</Text>
    </TouchableOpacity>
  );
}

/* ------- Styles ------- */
function shadow(elev = 4) {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elev / 2 },
      shadowOpacity: 0.1,
      shadowRadius: elev,
    },
    android: { elevation: elev },
    default: {},
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  welcome: { textAlign: 'center', marginBottom: 8 },

  // Header title/subtitle
  hTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 2 },
  hSub: { color: 'rgba(255,255,255,0.95)', fontSize: 12, fontWeight: '600' },

  // Notification icon wrapper (for stable badge positioning)
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Badge
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    // subtle border for contrast against gradient headers
    borderWidth: Platform.OS === 'ios' ? 1 : 0,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Admin hero
  hero: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    marginTop: -60,
    ...shadow(6),
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroTextWrap: { flex: 1 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 62 },
  heroSub: { color: 'rgba(255,255,255,0.92)', marginTop: 6, fontWeight: '700' },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    marginTop: 50,
  },
  avatarText: { color: '#0F172A', fontSize: 20, fontWeight: '900' },

  quickWrap: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 12 },

  tile: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    padding: 14,
    alignItems: 'center',
    ...shadow(2),
  },
  tileFill: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileText: { color: '#0F172A', fontWeight: '800' },
});
