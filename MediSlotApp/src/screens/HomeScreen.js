// src/screens/HomeScreen.js
import React, { useLayoutEffect, useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Button, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../api/config';

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

  const goNotifications = useCallback(() => {
    if (canGoTo('Notifications')) navigation.navigate('Notifications');
    else Alert.alert('Notifications', 'Notification list screen is not available.');
  }, [navigation, canGoTo]);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut() },
    ]);
  }, [signOut]);

  // ---- Fetch notification count (skip for admin since bell hidden) ----
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

  // Refresh on focus + polling (users only)
  useFocusEffect(
    useCallback(() => {
      fetchNotifCount();
      if (!isAdmin) {
        pollingRef.current = setInterval(fetchNotifCount, 30000);
      }
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }, [fetchNotifCount, isAdmin])
  );

  // Header buttons
  useLayoutEffect(() => {
    if (user && canGoTo('Profile')) {
      navigation.setOptions({
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Notification bell → only for NON-admin */}
            {!isAdmin && (
              <Pressable onPress={goNotifications} hitSlop={10} style={{ marginRight: 14 }}>
                <View>
                  <Ionicons name="notifications-outline" size={26} />
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

            {/* Profile (both admin & user) */}
            <Pressable onPress={goProfile} hitSlop={10}>
              <Ionicons name="person-circle-outline" size={28} />
            </Pressable>

            {/* Logout (both admin & user) */}
            <Pressable onPress={handleLogout} hitSlop={10} style={{ marginLeft: 14 }}>
              <Ionicons name="log-out-outline" size={26} />
            </Pressable>
          </View>
        ),
      });
    } else {
      navigation.setOptions({ headerRight: undefined });
    }
  }, [navigation, user, canGoTo, goProfile, handleLogout, goNotifications, notifCount, isAdmin]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>

      {!user && <Button title="Go to Login" onPress={goLogin} />}

      {user && !isAdmin && (
        <Text style={styles.welcome}>Welcome back 👋</Text>
      )}

      {/* ✅ Admin-only: big Scan QR button on Home */}
      {user && isAdmin && (
        <TouchableOpacity
          style={styles.scanBtn}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AdminScan')}
        >
          <Text style={styles.scanText}>📷 Scan QR</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  welcome: { textAlign: 'center', marginBottom: 8 },
  // Header badge
  badge: {
    position: 'absolute',
    right: -8,
    top: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Admin scan button
  scanBtn: {
    marginTop: 24,
    alignSelf: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    elevation: 2,
  },
  scanText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
