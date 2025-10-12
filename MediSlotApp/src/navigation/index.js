// src/navigation/index.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// ----- Screens (User side) -----
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import FreeEventsScreen from "../screens/FreeEventsScreen";
import EventRegisterScreen from "../screens/EventRegisterScreen";
import HealthCentersScreen from "../screens/HealthCentersScreen";
import HealthCentersMapScreen from "../screens/HealthCentersMapScreen";
import CenterDetailsScreen from "../screens/CenterDetailsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import HealthAwarenessListScreen from "../screens/HealthAwarenessListScreen";
import HealthAwarenessDetailScreen from "../screens/HealthAwarenessDetailScreen";

// ----- Screens (Admin side) -----
import AdminScanScreen from "../screens/AdminScanScreen";

// ----- Lab Tests (Guidelines) flow -----
import TestCategoriesScreen from "../screens/Guidelines/TestCategoriesScreen";
import TestListScreen from "../screens/Guidelines/TestListScreen";
import TestDetailsScreen from "../screens/Guidelines/TestDetailsScreen";
import MyChecklistScreen from "../screens/MyChecklistScreen";

// ----- Booking flow (your module) -----
import NewBookingScreen from "../screens/NewBookingScreen";
import BookingHistoryScreen from "../screens/BookingHistoryScreen";
import PaymentDetailsScreen from "../screens/PaymentDetailsScreen";
import BookingSuccessScreen from "../screens/BookingSuccessScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ------------------- USER STACKS ------------------- */
function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerTitleAlign: "center", headerShown: false }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "MediSlot" }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Login" }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: "Register" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "My Profile" }}
      />
      <Stack.Screen
        name="HealthAwarenessList"
        component={HealthAwarenessListScreen}
        options={{ title: "Health Awareness" }}
      />
      <Stack.Screen
        name="HealthAwarenessDetail"
        component={HealthAwarenessDetailScreen}
        options={{ title: "Awareness Details" }}
      />
      <Stack.Screen
        name="AdminScan"
        component={AdminScanScreen}
        options={{ title: "Admin – Scan QR" }}
      />

      {/* ✅ Booking flow screens */}
      <Stack.Screen
        name="NewBooking"
        component={NewBookingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentDetails"
        component={PaymentDetailsScreen}
        options={{ title: "Payment" }}
      />
      <Stack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
  name="MyChecklist"
  component={MyChecklistScreen}
  options={{ title: "My Checklists" }}
/>
    </Stack.Navigator>
  );
}

function FreeEventsStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerTitleAlign: "center", headerShown: false }}
    >
      <Stack.Screen name="FreeEvents" component={FreeEventsScreen} />
      <Stack.Screen name="EventRegister" component={EventRegisterScreen} />
    </Stack.Navigator>
  );
}

function HealthCentersStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerTitleAlign: "center", headerShown: false }}
    >
      <Stack.Screen name="HealthCenters" component={HealthCentersScreen} />
      <Stack.Screen
        name="HealthCentersMap"
        component={HealthCentersMapScreen}
      />
      <Stack.Screen name="CenterDetails" component={CenterDetailsScreen} />
      <Stack.Screen
        name="NewBooking"
        component={NewBookingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PaymentDetails"
        component={PaymentDetailsScreen}
        options={{ title: "Payment" }}
      />
      <Stack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function GuidelinesStack() {
  // keeping your existing multi-screen Guidelines flow (categories → list → details)
  return (
    <Stack.Navigator
      initialRouteName="TestCategories"
      screenOptions={{ headerTitleAlign: "center", headerShown: false }}
    >
      <Stack.Screen
        name="TestCategories"
        component={TestCategoriesScreen}
        options={{ title: "Lab Test Categories" }}
      />
      <Stack.Screen
        name="TestList"
        component={TestListScreen}
        options={({ route }) => ({ title: route.params?.category || "Tests" })}
      />
      <Stack.Screen
        name="TestDetails"
        component={TestDetailsScreen}
        options={({ route }) => ({
          title: route.params?.name || "Test Details",
        })}
      />
    </Stack.Navigator>
  );
}

/* ------------------- TABS (User) ------------------- */
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            HomeTab: "home-outline",
            FreeEventsTab: "ticket-outline",
            HealthCentersTab: "medkit-outline",
            GuidelinesTab: "book-outline",
          };
          return (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          );
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

/* ------------------- ADMIN STACK ------------------- */
function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerTitleAlign: "center", headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AdminScan" component={AdminScanScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

/* ------------------- ROOT ------------------- */
export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  const role = (user?.user_category || "").toLowerCase();
  const isAdmin =
    role === "admin" || role === "superadmin" || role === "manager";

  return (
    <NavigationContainer>
      {isAdmin ? <AdminStack /> : <MainTabs />}
    </NavigationContainer>
  );
}
