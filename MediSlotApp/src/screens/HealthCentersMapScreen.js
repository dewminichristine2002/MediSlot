// src/screens/HealthCentersMap.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { fetchCenters } from "../api/centers";

/* ——— Theme ——— */
const THEME = {
  bg: "#F7F9FC",
  line: "#E5E7EB",
  brand: ["#3B82F6", "#22D3EE", "#34D399"],
  card: "#fff",
  text: "#0F172A",
  sub: "#6B7280",
};

function getLatLng(c) {
  const lat =
    c?.coords?.lat ??
    (Array.isArray(c?.location?.coordinates) ? c.location.coordinates[1] : null);
  const lng =
    c?.coords?.lng ??
    (Array.isArray(c?.location?.coordinates) ? c.location.coordinates[0] : null);
  return lat != null && lng != null ? { latitude: Number(lat), longitude: Number(lng) } : null;
}

export default function HealthCentersMap({ navigation }) {
  const { token } = useAuth();
  const [centers, setCenters] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hide the native header so our banner shows
  useEffect(() => {
    navigation.setOptions({ headerShown: false, headerBackVisible: false });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          setUserPos({
            latitude: Number(loc.coords.latitude),
            longitude: Number(loc.coords.longitude),
          });
        }
        const data = await fetchCenters(token);
        setCenters(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const markers = useMemo(
    () =>
      (centers || [])
        .map((c) => ({ center: c, ll: getLatLng(c) }))
        .filter((x) => !!x.ll),
    [centers]
  );

  const initialRegion = useMemo(() => {
    const first = markers[0]?.ll || userPos || { latitude: 7.8731, longitude: 80.7718 }; // Sri Lanka fallback
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 1.2,
      longitudeDelta: 1.2,
    };
  }, [markers, userPos]);

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      {/* Gradient banner */}
      <LinearGradient
        colors={THEME.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>Map View</Text>
        <Text style={styles.bannerSub}>See all centers on the map</Text>
      </LinearGradient>

      {/* Back row (under banner) */}
      <View style={styles.backRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={THEME.brand[0]} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapCard}>
        {loading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" />
            <Text style={{ color: THEME.sub, marginTop: 8 }}>Loading map…</Text>
          </View>
        ) : (
          <MapView style={{ flex: 1 }} initialRegion={initialRegion} showsUserLocation>
            {userPos ? (
              <Circle
                center={userPos}
                radius={3000}
                strokeColor="rgba(37,99,235,0.5)"
                fillColor="rgba(37,99,235,0.12)"
              />
            ) : null}

            {markers.map(({ center, ll }) => (
              <Marker
                key={center._id}
                coordinate={ll}
                title={center.name}
                description={[
                  center?.address?.city,
                  center?.address?.district,
                  center?.address?.province,
                ]
                  .filter(Boolean)
                  .join(", ")}
                onCalloutPress={() => navigation.navigate("CenterDetails", { center })}
              />
            ))}
          </MapView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
  paddingHorizontal: 20,
  paddingVertical: 60,   // ⬅️ both top & bottom 60
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
},
  bannerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  bannerSub: { color: "#E6F6FF", marginTop: 2 },

  backRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { color: THEME.brand[0], fontWeight: "800", fontSize: 14, marginLeft: 2 },

  mapCard: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.line,
  },
  mapLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
