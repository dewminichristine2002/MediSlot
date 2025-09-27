// src/navigation/index.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";

// Screens (user side)
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FreeEventsScreen from '../screens/FreeEventsScreen';
import EventRegisterScreen from '../screens/EventRegisterScreen';
import HealthCentersScreen from '../screens/HealthCentersScreen';
import HealthCentersMapScreen from '../screens/HealthCentersMapScreen';
import CenterDetailsScreen from '../screens/CenterDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HealthAwarenessListScreen from '../screens/HealthAwarenessListScreen';
import HealthAwarenessDetailScreen from '../screens/HealthAwarenessDetailScreen';

// Screens (admin side)
import AdminScanScreen from '../screens/AdminScanScreen';

// Lab Tests (Guidelines) flow
import TestCategoriesScreen from '../screens/Guidelines/TestCategoriesScreen';
import TestListScreen from '../screens/Guidelines/TestListScreen';
import TestDetailsScreen from '../screens/Guidelines/TestDetailsScreen';
// Screens
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";

import FreeEventsScreen from "../screens/FreeEventsScreen";
import EventRegisterScreen from "../screens/EventRegisterScreen";

import HealthCentersScreen from "../screens/HealthCentersScreen";
import GuidelinesScreen from "../screens/GuidelinesScreen";

import NewBookingScreen from "../screens/NewBookingScreen";
import BookingHistoryScreen from "../screens/BookingHistoryScreen";
import PaymentCheckoutScreen from "../screens/PaymentCheckoutScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ---------- USER STACKS (shown in tabs) ---------- */
/** ---------- Stacks per tab ---------- */

// Home stack: Home + auth + profile + booking screens
function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerTitleAlign: 'center', headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'MediSlot' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="HealthAwarenessList" component={HealthAwarenessListScreen} options={{ title: 'Health Awareness List' }} />
      <Stack.Screen name="HealthAwarenessDetail" component={HealthAwarenessDetailScreen} options={{ title: 'Health Awareness Details' }} />
      <Stack.Screen name="AdminScan" component={AdminScanScreen} options={{ title: 'Admin – Scan QR' }} />
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: true, title: "Home" }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: true, title: "Home" }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: true, title: "Home" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: true, title: "Home" }}
      />

      {/* New booking flow */}
      <Stack.Screen
        name="NewBooking"
        component={NewBookingScreen}
        // 🔵 Hide native header so the screen's gradient header is the only one
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentCheckout"
        component={PaymentCheckoutScreen}
        options={{ title: "Pay Securely" }}
      />

      {/* Booking history */}
      <Stack.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        // 🔵 Hide native header so the screen's gradient header is the only one
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function FreeEventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center', headerShown: false }}>
      <Stack.Screen name="FreeEvents" component={FreeEventsScreen} options={{ title: 'Free Events' }} />
      {/* from the “below” snippet */}
      <Stack.Screen name="EventRegister" component={EventRegisterScreen} options={{ title: 'Register for Event' }} />
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen
        name="FreeEvents"
        component={FreeEventsScreen}
        options={{ title: "Free Events" }}
      />
      <Stack.Screen
        name="EventRegister"
        component={EventRegisterScreen}
        options={{ title: "Register for Event" }}
      />
    </Stack.Navigator>
  );
}

function HealthCentersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center', headerShown: false }}>
      <Stack.Screen name="HealthCenters" component={HealthCentersScreen} options={{ title: 'Health Centers' }} />
      {/* added per “below” snippet */}
      <Stack.Screen name="HealthCentersMap" component={HealthCentersMapScreen} options={{ title: 'Map View' }} />
      <Stack.Screen name="CenterDetails" component={CenterDetailsScreen} options={{ title: 'Center Details' }} />
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen
        name="HealthCenters"
        component={HealthCentersScreen}
        options={{ title: "Health Centers" }}
      />
    </Stack.Navigator>
  );
}

function GuidelinesStack() {
  // keeping your existing multi-screen Guidelines flow (categories → list → details)
  return (
    <Stack.Navigator initialRouteName="TestCategories" screenOptions={{ headerTitleAlign: 'center', headerShown: false }}>
      <Stack.Screen name="TestCategories" component={TestCategoriesScreen} options={{ title: 'Lab Test Categories' }} />
      <Stack.Screen name="TestList" component={TestListScreen} options={({ route }) => ({ title: route.params?.category || 'Tests' })} />
      <Stack.Screen name="TestDetails" component={TestDetailsScreen} options={({ route }) => ({ title: route.params?.name || 'Test Details' })} />
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen
        name="Guidelines"
        component={GuidelinesScreen}
        options={{ title: "Guidelines" }}
      />
    </Stack.Navigator>
  );
}

/* ---------- TABS (non-admin) ---------- */
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            HomeTab: 'home-outline',
            FreeEventsTab: 'ticket-outline',
            HealthCentersTab: 'medkit-outline',
            GuidelinesTab: 'book-outline',
          const map = {
            HomeTab: "home-outline",
            FreeEventsTab: "ticket-outline",
            HealthCentersTab: "medkit-outline",
            GuidelinesTab: "book-outline",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 11 },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="FreeEventsTab"
        component={FreeEventsStack}
        options={{ title: "Free Events" }}
      />
      <Tab.Screen
        name="HealthCentersTab"
        component={HealthCentersStack}
        options={{ title: "Health Centers" }}
      />
      <Tab.Screen
        name="GuidelinesTab"
        component={GuidelinesStack}
        options={{ title: "Guidelines" }}
      />
    </Tab.Navigator>
  );
}

/* ---------- ADMIN-ONLY (no tabs) ---------- */
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center', headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'MediSlot' }} />
      <Stack.Screen name="AdminScan" component={AdminScanScreen} options={{ title: 'Admin – Scan QR' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Admin Profile' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
      {/* Intentionally no Notifications for admins */}
    </Stack.Navigator>
  );
}

/* ---------- ROOT ---------- */
export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null; // show splash if you have one

  const role = (user?.user_category || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'manager';
  const { loading } = useAuth();
  if (loading) return null; // optional splash

  return (
    <NavigationContainer>
      {isAdmin ? <AdminStack /> : <MainTabs />}
    </NavigationContainer>
  );
}
