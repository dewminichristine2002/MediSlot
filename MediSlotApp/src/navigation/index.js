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

/** ---------- USER STACKS (Shown only to non-admins via tabs) headerShown: false---------- */
function HomeStack() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerTitleAlign: 'center', }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'MediSlot' , headerShown: false}} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications', headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login',headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register',headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' , headerShown: false}} />
      <Stack.Screen name="HealthAwarenessList" component={HealthAwarenessListScreen} options={{ title: 'Health Awareness List',headerShown: false }}/>
      <Stack.Screen name="HealthAwarenessDetail" component={HealthAwarenessDetailScreen} options={{ title: 'Health Awareness Details',headerShown: false }} />
      {/* Keep AdminScan here only if you want to deep-link it; otherwise remove */}
      <Stack.Screen name="AdminScan" component={AdminScanScreen} options={{ title: 'Admin – Scan QR',headerShown: false }} />
    </Stack.Navigator>
  );
}

function FreeEventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center', headerShown: false}}>
      <Stack.Screen name="FreeEvents" component={FreeEventsScreen} options={{ title: 'Free Events' }} />
      <Stack.Screen name="EventRegister" component={EventRegisterScreen} options={{ title: 'Event Registration' }} />
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
    <Stack.Navigator
      initialRouteName="TestCategories"
      screenOptions={{ headerTitleAlign: 'center', headerShown: false}}
    >
      <Stack.Screen
        name="TestCategories"
        component={TestCategoriesScreen}
        options={{ title: 'Lab Test Categories' }}
      />
      <Stack.Screen
        name="TestList"
        component={TestListScreen}
        options={({ route }) => ({ title: route.params?.category || 'Tests' })}
      />
      <Stack.Screen
        name="TestDetails"
        component={TestDetailsScreen}
        options={({ route }) => ({ title: route.params?.name || 'Test Details' })}
      />
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
      <Tab.Screen name="FreeEventsTab" component={FreeEventsStack} options={{ title: 'Free Events',headerShown: false }} />
      <Tab.Screen name="HealthCentersTab" component={HealthCentersStack} options={{ title: 'Health Centers',headerShown: false }} />
      <Tab.Screen name="GuidelinesTab" component={GuidelinesStack} options={{ title: 'Guidelines',headerShown: false }} />
    </Tab.Navigator>
  );
}

/** ---------- ADMIN-ONLY STACK (No tabs, no Notifications route) ---------- */
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center', }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'MediSlot' }} />
      <Stack.Screen name="AdminScan" component={AdminScanScreen} options={{ title: 'Admin – Scan QR',headerShown: false}} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Admin Profile',headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login',headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register',headerShown: false }} />
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
