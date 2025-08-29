// src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FreeEventsScreen from '../screens/FreeEventsScreen';
import HealthCentersScreen from '../screens/HealthCentersScreen';
import GuidelinesScreen from '../screens/GuidelinesScreen';
import EventRegisterScreen from "../screens/EventRegisterScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** ---------- Stacks per tab ---------- */

// Home stack holds Home + auth-related pages
function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerTitleAlign: 'center' }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Stack.Navigator>
  );
}

function FreeEventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen
        name="FreeEvents"
        component={FreeEventsScreen}
        options={{ title: 'Free Events' }}
      />
      {/* ⬇️ NEW: register screen that FreeEvents can push to */}
      <Stack.Screen
        name="EventRegister"
        component={EventRegisterScreen}
        options={{ title: 'Register for Event' }}
      />
    </Stack.Navigator>
  );
}

function HealthCentersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen
        name="HealthCenters"
        component={HealthCentersScreen}
        options={{ title: 'Health Centers' }}
      />
    </Stack.Navigator>
  );
}

function GuidelinesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen
        name="Guidelines"
        component={GuidelinesScreen}
        options={{ title: 'Guidelines' }}
      />
    </Stack.Navigator>
  );
}

/** ---------- Tabs ---------- */

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false, // stacks handle their own headers
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

/** ---------- Root ---------- */

export default function RootNavigator() {
  const { loading } = useAuth();
  if (loading) return null; // optionally show a splash while restoring auth

  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
