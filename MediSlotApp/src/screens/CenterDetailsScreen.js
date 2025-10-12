// src/screens/CenterDetailsScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import axios from "axios";
import Constants from "expo-constants";

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

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.GMAPS_API_KEY ||
  process.env.GMAPS_API_KEY ||
  "YOUR_API_KEY";

/* ---------- Small UI helpers ---------- */
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const GradientButton = ({ children, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={style} activeOpacity={0.9}>
    <LinearGradient
      colors={THEME.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBtn}
    >
      <Text style={styles.gradientBtnText}>{children}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const SoftButton = ({ children, onPress, style }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.softBtn, style]}
    activeOpacity={0.9}
  >
    <Text style={styles.softBtnText}>{children}</Text>
  </TouchableOpacity>
);

/* ---------- Utils ---------- */
function getLatLng(center) {
  const toNum = (v) =>
    v === 0 || v === "0"
      ? 0
      : v != null && v !== "" && !Number.isNaN(Number(v))
      ? Number(v)
      : null;

  const fromCoords = center?.coords
    ? { lat: toNum(center.coords.lat), lng: toNum(center.coords.lng) }
    : null;

  const fromLL =
    center?.latitude != null && center?.longitude != null
      ? { lat: toNum(center.latitude), lng: toNum(center.longitude) }
      : null;

  const fromGeo =
    Array.isArray(center?.location?.coordinates) &&
    center.location.coordinates.length >= 2
      ? {
          lat: toNum(center.location.coordinates[1]),
          lng: toNum(center.location.coordinates[0]),
        }
      : null;

  const lat = fromCoords?.lat ?? fromLL?.lat ?? fromGeo?.lat ?? null;
  const lng = fromCoords?.lng ?? fromLL?.lng ?? fromGeo?.lng ?? null;
  return lat != null && lng != null ? { lat, lng } : null;
}

function decodePolyline(encoded) {
  let points = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

/* ---------- Route preview ---------- */
function RoutePreview({ center }) {
  const [userPos, setUserPos] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceText, setDistanceText] = useState(null);
  const [durationText, setDurationText] = useState(null);
  const [loading, setLoading] = useState(true);

  const centerLL = useMemo(() => {
    if (!center) return null;
    const ll = getLatLng(center);
    return ll ? { latitude: ll.lat, longitude: ll.lng } : null;
  }, [center]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const me = {
          latitude: Number(loc.coords.latitude),
          longitude: Number(loc.coords.longitude),
        };
        setUserPos(me);

        if (
          !centerLL ||
          !GOOGLE_MAPS_API_KEY ||
          GOOGLE_MAPS_API_KEY === "YOUR_API_KEY"
        ) {
          setLoading(false);
          return;
        }

        const origin = `${me.latitude},${me.longitude}`;
        const destination = `${centerLL.latitude},${centerLL.longitude}`;
        const url =
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}` +
          `&destination=${destination}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

        const resp = await axios.get(url);
        const route = resp?.data?.routes?.[0];
        const leg = route?.legs?.[0];

        if (route?.overview_polyline?.points) {
          setRouteCoords(decodePolyline(route.overview_polyline.points));
        }
        if (leg) {
          setDistanceText(leg.distance?.text || null);
          setDurationText(leg.duration?.text || null);
        }
      } catch (e) {
        console.log("Directions API error:", e?.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, [centerLL]);

  if (!centerLL) return null;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <View style={{ height: 240 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: centerLL.latitude,
            longitude: centerLL.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation
        >
          <Marker coordinate={centerLL} title={center?.name} />
          {userPos ? <Marker coordinate={userPos} title="You" /> : null}
          {routeCoords.length > 0 ? (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={5}
              strokeColor="#2563EB"
            />
          ) : null}
        </MapView>
      </View>

      <View
        style={{
          padding: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: THEME.line,
        }}
      >
        {loading ? (
          <ActivityIndicator />
        ) : distanceText || durationText ? (
          <Text style={{ color: THEME.subtext }}>
            Estimated: {distanceText ? `${distanceText}` : ""}{" "}
            {durationText ? `• ${durationText}` : ""}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

/* ---------- Screen ---------- */
export default function CenterDetailsScreen({ route, navigation }) {
  const center = route?.params?.center;
  const { token } = useAuth();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    if (!center) {
      Alert.alert("Center not found", "No center data was provided.");
      navigation.goBack();
    }
  }, [navigation, center]);

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

  const openExternalDirections = async () => {
    const ll = getLatLng(center);
    const addr = formatAddress(center.address)?.trim();
    const dest = ll
      ? `${ll.lat},${ll.lng}`
      : addr
      ? encodeURIComponent(addr)
      : "";

    if (!dest) {
      Alert.alert(
        "Location unavailable",
        "This center has no coordinates or searchable address."
      );
      return;
    }

    try {
      if (Platform.OS === "ios") {
        const hasGoogleApp = await Linking.canOpenURL("comgooglemaps://");
        if (hasGoogleApp) {
          return Linking.openURL(
            `comgooglemaps://?saddr=&daddr=${dest}&directionsmode=driving`
          );
        }
        return Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
        );
      }

      return Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
      );
    } catch (e) {
      Alert.alert("Couldn't open Google Maps", e?.message || "Unknown error.");
    }
  };

  const renderTest = ({ item }) => (
    <View style={styles.testRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.testName}>{item.name}</Text>
        {item.what ? (
          <Text style={styles.testSub} numberOfLines={2}>
            {item.what}
          </Text>
        ) : null}

        <View style={styles.actionRow}>
          <SoftButton
            style={{ flex: 1 }}
            onPress={() =>
              navigation.navigate("NewBooking", {
                centerId: center._id,
                testId: item.test_id ?? item._id,
              })
            }
          >
            Book Now
          </SoftButton>

          <SoftButton
            style={{ flex: 1 }}
            onPress={() =>
              navigation.navigate("TestDetails", { test: item, center })
            }
          >
            More Details
          </SoftButton>
        </View>
      </View>

      <View style={{ marginLeft: 10, alignItems: "flex-end" }}>
        {item.price != null ? (
          <Text style={styles.testPrice}>Rs. {item.price}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      <LinearGradient
        colors={THEME.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Center Details</Text>
        <Text style={styles.headerSub}>{center?.name ?? ""}</Text>
      </LinearGradient>

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
        <Card>
          <Text style={styles.centerTitle}>{center.name}</Text>
          <Text style={styles.centerSub}>{formatAddress(center.address)}</Text>
          {center.phone ? (
            <Text style={[styles.centerSub, { marginTop: 2 }]}>
              {center.phone}
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <GradientButton
              onPress={openExternalDirections}
              style={{ flex: 1 }}
            >
              Directions
            </GradientButton>
          </View>
        </Card>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Available Tests</Text>
          {loading ? (
            <ActivityIndicator size="large" />
          ) : tests.length === 0 ? (
            <Text style={{ color: THEME.subtext }}>
              No tests published for this center.
            </Text>
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
  backIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 2,
  },
  backText: {
    color: THEME.brand[0],
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 2,
  },

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

  gradientBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  gradientBtnText: { color: "#fff", fontWeight: "800", textAlign: "center" },

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
