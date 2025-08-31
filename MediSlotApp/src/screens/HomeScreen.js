import React, { useLayoutEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();

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

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut() },
    ]);
  }, [signOut]);

  useLayoutEffect(() => {
    if (user && canGoTo('Profile')) {
      navigation.setOptions({
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={goProfile} hitSlop={10}>
              <Ionicons name="person-circle-outline" size={28} />
            </Pressable>
            <Pressable onPress={handleLogout} hitSlop={10} style={{ marginLeft: 14 }}>
              <Ionicons name="log-out-outline" size={26} />
            </Pressable>
          </View>
        ),
      });
    } else {
      navigation.setOptions({ headerRight: undefined });
    }
  }, [navigation, user, canGoTo, goProfile, handleLogout]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>

      {/* Show Login button only when NOT authenticated */}
      {!user ? (
        <Button title="Go to Login" onPress={goLogin} />
      ) : (
        <Text style={styles.welcome}>Welcome back 👋</Text>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  welcome: { textAlign: 'center', marginBottom: 8 },
  menuSection: { marginTop: 16 },
  menuTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: { marginTop: 8, fontWeight: '600' },
});
