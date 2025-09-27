// src/screens/CenterDetailsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { fetchCenterTests } from "../api/centers";
import { formatAddress } from "../utils/format";

const THEME = {
  bg: "#F7F9FC",
  text: "#0F172A",
  subtext: "#6B7280",
  card: "#FFFFFF",
  line: "#E5E7EB",
  brand: ["#3B82F6", "#22D3EE", "#34D399"],
};

function getLatLng(center) {
  // Supports GeoJSON { location: { coordinates: [lng, lat] } }
  const coords = Array.isArray(center?.location?.coordinates)
    ? center.location.coordinates
    : null;
  if (coords && coords.length >= 2) {
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

export default function CenterDetailsScreen({ route, navigation }) {
  const center = route?.params?.center;
  const { token } = useAuth();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // fail fast if route missing
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    if (!center) {
      Alert.alert("Center not found", "No center data was provided.");
      navigation.goBack();
    }
  }, [navigation, center]);

  // load tests for this center
  useEffect(() => {
    if (!center?._id) return;
    (async () => {
      try {
        const data = await fetchCenterTests(center._id, token);
        setTests(Array.isArray(data) ? data : []);
      } catch (e) {
        console.log("fetchCenterTests error:", e?.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, [center?._id, token]);

  const mapPoint = getLatLng(center);

  const renderTest = ({ item }) => (
    <View style={styles.testRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.testName}>{item?.name || "Lab Test"}</Text>
        {item?.what ? (
          <Text style={styles.testSub} numberOfLines={2}>
            {item.what}
          </Text>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.softBtn, { flex: 1 }]}
            onPress={() =>
              navigation.navigate("NewBooking", {
                centerId: center._id,
                testId: item.test_id ?? item._id,
              })
            }
          >
            <Text style={styles.softBtnText}>Book Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.softBtn, { flex: 1 }]}
            onPress={() => navigation.navigate("TestDetails", { test: item, center })}
          >
            <Text style={styles.softBtnText}>More Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ marginLeft: 10, alignItems: "flex-end" }}>
        {item?.price != null ? (
          <Text style={styles.testPrice}>Rs. {item.price}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      {/* Header */}
      <LinearGradient colors={THEME.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Center Details</Text>
        <Text style={styles.headerSub}>{center?.name ?? ""}</Text>
      </LinearGradient>

      {/* Back */}
      <View style={styles.backRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={THEME.brand[0]} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Top card */}
        <View style={styles.card}>
          <Text style={styles.centerTitle}>{center?.name ?? "Center"}</Text>
          {!!center?.address && (
            <Text style={styles.centerSub}>{formatAddress(center.address)}</Text>
          )}
          {!!center?.phone && (
            <Text style={[styles.centerSub, { marginTop: 2 }]}>{center.phone}</Text>
          )}
        </View>

        {/* Map */}
        {mapPoint ? (
          <View style={[styles.card, { padding: 0, overflow: "hidden" }]}>
            <View style={{ height: 240 }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: mapPoint.latitude,
                  longitude: mapPoint.longitude,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
                showsUserLocation
              >
                <Marker coordinate={mapPoint} title={center?.name} />
              </MapView>
            </View>
          </View>
        ) : null}

        {/* Tests */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Available Tests</Text>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : tests.length === 0 ? (
            <Text style={{ color: THEME.subtext }}>No tests published for this center.</Text>
          ) : (
            <FlatList
              data={tests}
              keyExtractor={(t, i) => t?._id ?? `${t?.name}-${i}`}
              renderItem={renderTest}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 60,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "#E6F6FF", marginTop: 4 },

  backRow: { paddingHorizontal: 10, paddingTop: 8 },
  backIconBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 2 },
  backText: { color: THEME.brand[0], fontWeight: "800", fontSize: 14, marginLeft: 2 },

  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 14,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  centerTitle: { fontSize: 20, fontWeight: "800", color: THEME.text },
  centerSub: { color: THEME.subtext, marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: THEME.line,
    marginVertical: 8,
  },

  testRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
  },
  testName: { fontSize: 15, fontWeight: "700" },
  testSub: { color: THEME.subtext, marginTop: 2, maxWidth: 210 },
  testPrice: { fontWeight: "800" },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },

  softBtn: {
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  softBtnText: { color: "#4338CA", fontWeight: "800", textAlign: "center" },
});
