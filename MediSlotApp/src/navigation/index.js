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
import EventRegisterScreen from "../screens/EventRegisterScreen";
import HealthCentersMapScreen from '../screens/HealthCentersMapScreen';
import CenterDetailsScreen from '../screens/CenterDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Screens (admin side)
import AdminScanScreen from '../screens/AdminScanScreen';

// Lab Tests screens (Guidelines flow)
import TestCategoriesScreen from '../screens/Guidelines/TestCategoriesScreen';
import TestListScreen from '../screens/Guidelines/TestListScreen';
import TestDetailsScreen from '../screens/Guidelines/TestDetailsScreen';
import HealthAwarenessListScreen from "../screens/HealthAwarenessListScreen";
import HealthAwarenessDetailScreen from "../screens/HealthAwarenessDetailScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** ---------- USER STACKS ---------- */
function HomeStack() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'MediSlot', headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HealthAwarenessList" component={HealthAwarenessListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HealthAwarenessDetail" component={HealthAwarenessDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminScan" component={AdminScanScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function FreeEventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FreeEvents" component={FreeEventsScreen} />
      <Stack.Screen name="EventRegister" component={EventRegisterScreen} />
    </Stack.Navigator>
  );
}

function HealthCentersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="HealthCenters" component={HealthCentersScreen} options={{ title: 'Health Centers' }} />
      {/* ✅ Added CenterDetails screen here */}
      <Stack.Screen name="CenterDetails" component={CenterDetailsScreen} options={{ headerShown: false }} />
      {/* (Optional) if you also need the map view inside this stack */}
      <Stack.Screen name="HealthCentersMap" component={HealthCentersMapScreen} options={{ title: 'Centers Map' }} />
    </Stack.Navigator>
  );
}

function GuidelinesStack() {
  return (
    <Stack.Navigator initialRouteName="TestCategories" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TestCategories" component={TestCategoriesScreen} />
      <Stack.Screen name="TestList" component={TestListScreen} />
      <Stack.Screen name="TestDetails" component={TestDetailsScreen} />
    </Stack.Navigator>
  );
}

/** ---------- TABS ---------- */
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

/** ---------- ADMIN STACK ---------- */
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'MediSlot' }} />
      <Stack.Screen name="AdminScan" component={AdminScanScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

/** ---------- ROOT ---------- */
export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null; // splash

  const role = (user?.user_category || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'manager';

  return (
    <NavigationContainer>
      {isAdmin ? <AdminStack /> : <MainTabs />}
    </NavigationContainer>
  );
}
