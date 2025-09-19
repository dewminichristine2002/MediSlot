// src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

// Screens (user side)
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FreeEventsScreen from '../screens/FreeEventsScreen';
import HealthCentersScreen from '../screens/HealthCentersScreen';
import GuidelinesScreen from '../screens/GuidelinesScreen';
import EventRegisterScreen from '../screens/EventRegisterScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Screens (admin side)
import AdminScanScreen from '../screens/AdminScanScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** ---------- USER STACKS (Shown only to non-admins via tabs) ---------- */
function HomeStack() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      {/* Keep AdminScan here only if you want to deep-link it; otherwise remove */}
      <Stack.Screen name="AdminScan" component={AdminScanScreen} options={{ title: 'Admin – Scan QR' }} />
    </Stack.Navigator>
  );
}

function FreeEventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="FreeEvents" component={FreeEventsScreen} options={{ title: 'Free Events' }} />
      <Stack.Screen name="EventRegister" component={EventRegisterScreen} options={{ title: 'Register for Event' }} />
    </Stack.Navigator>
  );
}

function HealthCentersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="HealthCenters" component={HealthCentersScreen} options={{ title: 'Health Centers' }} />
    </Stack.Navigator>
  );
}

function GuidelinesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="Guidelines" component={GuidelinesScreen} options={{ title: 'Guidelines' }} />
    </Stack.Navigator>
  );
}

/** ---------- TABS (Non-admin only) ---------- */
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const map = {
            HomeTab: 'home-outline',
            FreeEventsTab: 'ticket-outline',
            HealthCentersTab: 'medkit-outline',
            GuidelinesTab: 'book-outline',
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 11 },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="FreeEventsTab" component={FreeEventsStack} options={{ title: 'Free Events' }} />
      <Tab.Screen name="HealthCentersTab" component={HealthCentersStack} options={{ title: 'Health Centers' }} />
      <Tab.Screen name="GuidelinesTab" component={GuidelinesStack} options={{ title: 'Guidelines' }} />
    </Tab.Navigator>
  );
}

/** ---------- ADMIN-ONLY STACK (No tabs, no Notifications route) ---------- */
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="AdminScan" component={AdminScanScreen} options={{ title: 'Admin – Scan QR' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Admin Profile' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
      {/* Intentionally NOT adding Notifications here for admins */}
    </Stack.Navigator>
  );
}

/** ---------- ROOT ---------- */
export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null; // or splash

  const role = (user?.user_category || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'manager';

  return (
    <NavigationContainer>
      {isAdmin ? <AdminStack /> : <MainTabs />}
    </NavigationContainer>
  );
}
