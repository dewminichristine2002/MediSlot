// src/screens/HealthCentersScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { fetchCenters } from "../api/centers";
import { haversineKm } from "../utils/geo";

const THEME = {
  bg: "#F7F9FC",
  card: "#fff",
  brand: ["#3B82F6", "#22D3EE", "#34D399"],
  pill: "#F1F5F9",
  pillText: "#334155",
  line: "#E5E7EB",
  subtext: "#6B7280",
  ok: "#16A34A",
  warn: "#D97706",
  danger: "#DC2626",
};

const QUICK = {
  NONE: "none",
  NEAREST: "nearest",
  OPENING: "opening",
  POPULAR: "popular",
};

function parseHM(s) {
  if (!s || typeof s !== "string" || !/^\d{2}:\d{2}$/.test(s)) return null;
  const [hh, mm] = s.split(":").map(Number);
  return hh * 60 + mm;
}

function nowMinutesColombo() {
  const now = new Date();
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes() + 330; // UTC+5:30
  return ((minutes % 1440) + 1440) % 1440;
}

function isOpeningSoon(center, windowMinutes = 120) {
  const open = parseHM(center?.opening_time);
  const close = parseHM(center?.closing_time);
  if (open == null || close == null) return false;
  const now = nowMinutesColombo();
  const openNow = open <= now && now < close;
  if (openNow) return false;
  if (now < open && open - now <= windowMinutes) return true;
  const untilMidnight = 1440 - now;
  return now >= close && open <= windowMinutes - untilMidnight;
}

function popularityScore(center) {
  const base = (center?.popularity ?? 0) + (center?.daily_count ?? 0);
  const openBoost = 480 - (parseHM(center?.opening_time) ?? 480);
  return base + Math.max(0, openBoost / 15) + (center?.name?.length || 0) / 10;
}

function getLatLng(c) {
  const lat =
    c?.coords?.lat ??
    (Array.isArray(c?.location?.coordinates) ? c.location.coordinates[1] : null);
  const lng =
    c?.coords?.lng ??
    (Array.isArray(c?.location?.coordinates) ? c.location.coordinates[0] : null);
  return lat != null && lng != null ? { lat, lng } : null;
}

function statusForCenter(c) {
  const open = parseHM(c?.opening_time);
  const close = parseHM(c?.closing_time);
  if (open == null || close == null) {
    return { label: "Hours not published", color: THEME.subtext };
  }
  const now = nowMinutesColombo();
  const openNow = open <= now && now < close;

  const fmt = (m) => {
    if (m == null) return "--:--";
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hh)}:${pad(mm)}`;
  };

  if (openNow) return { label: `Open now • Closes ${fmt(close)}`, color: THEME.ok };
  if (isOpeningSoon(c, 120)) return { label: `Closed • Opens ${fmt(open)} (soon)`, color: THEME.warn };
  return { label: `Closed • Opens ${fmt(open)}`, color: THEME.danger };
}

export default function HealthCentersScreen({ navigation }) {
  const { token } = useAuth();
  const [centers, setCenters] = useState([]);
  const [userPos, setUserPos] = useState(null); // {lat,lng}
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [nameQ, setNameQ] = useState("");
  const [radiusKm, setRadiusKm] = useState(0); // 0=all, 5, 10
  const [quick, setQuick] = useState(QUICK.NONE);
  const [error, setError] = useState("");

  // 🔕 Hide the Stack header (removes the top "Health Centers" bar)
  useEffect(() => {
    navigation.setOptions({ headerShown: false, headerBackVisible: false });
  }, [navigation]);

  async function loadBase() {
    setError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setUserPos({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
      const data = await fetchCenters(token);
      setCenters(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load health centers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBase();
  }, []);

  const data = useMemo(() => {
    const annotated = (centers || []).map((c) => {
      const ll = getLatLng(c);
      let distanceKm = null;
      if (userPos && ll) distanceKm = haversineKm(userPos, ll);
      return { ...c, distanceKm, openingSoon: isOpeningSoon(c, 120) };
    });

    const q = nameQ.trim().toLowerCase();
    let list = annotated.filter((c) => {
      if (!q) return true;
      return (
        c?.name?.toLowerCase().includes(q) ||
        (c?.address?.city || "").toLowerCase().includes(q) ||
        (c?.address?.district || "").toLowerCase().includes(q) ||
        (c?.address?.province || "").toLowerCase().includes(q)
      );
    });

    if (radiusKm > 0) list = list.filter((c) => c.distanceKm == null || c.distanceKm <= radiusKm);

    if (quick === QUICK.NEAREST) {
      list = [...list].sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9)).slice(0, 1);
    } else if (quick === QUICK.OPENING) {
      list = list.filter((c) => c.openingSoon);
      const now = nowMinutesColombo();
      list.sort((a, b) => {
        const oa = parseHM(a.opening_time) ?? 1e9;
        const ob = parseHM(b.opening_time) ?? 1e9;
        const da = (oa - now + 1440) % 1440;
        const db = (ob - now + 1440) % 1440;
        return da - db;
      });
    } else if (quick === QUICK.POPULAR) {
      list = [...list].sort((a, b) => popularityScore(b) - popularityScore(a)).slice(0, 3);
    } else {
      list = [...list].sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    }

    return list;
  }, [centers, nameQ, radiusKm, quick, userPos]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading health centers…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red", textAlign: "center", marginBottom: 12 }}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            loadBase();
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCenter = ({ item }) => {
    const status = statusForCenter(item);
    const distText =
      item.distanceKm == null
        ? "—"
        : item.distanceKm < 1
        ? `${(item.distanceKm * 1000).toFixed(0)} m`
        : `${item.distanceKm.toFixed(1)} km`;

    return (
      <TouchableOpacity
        style={styles.centerCard}
        onPress={() => navigation.navigate("CenterDetails", { center: item })}
        activeOpacity={0.9}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.distance}>{distText}</Text>
        </View>

        <Text style={styles.addrLine}>
          {(item?.address?.city || "")}
          {item?.address?.district ? `, ${item.address.district}` : ""}
          {item?.address?.province ? `, ${item.address.province}` : ""}
        </Text>

        <View style={styles.rowBetween}>
          <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
          {item.opening_time && item.closing_time ? (
            <Text style={styles.hours}>
              {item.opening_time} – {item.closing_time}
            </Text>
          ) : (
            <Text style={[styles.hours, { color: THEME.subtext }]}>—</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: THEME.bg }}>
      {/* Gradient banner (kept) */}
      <LinearGradient
        colors={THEME.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>Health Centers</Text>
        <Text style={styles.bannerSub}>Find nearby clinics and labs</Text>
      </LinearGradient>

      <View style={{ padding: 16 }}>
        {/* Search */}
        <TextInput
          style={styles.input}
          placeholder="Search by center or address…"
          value={nameQ}
          onChangeText={setNameQ}
        />

        {/* Radius chips */}
        <View style={{ flexDirection: "row", marginTop: 10 }}>
          {[0, 5, 10].map((km) => (
            <TouchableOpacity
              key={km}
              onPress={() => setRadiusKm(km)}
              style={[styles.pill, radiusKm === km && styles.pillActive]}
            >
              <Text style={[styles.pillText, radiusKm === km && styles.pillTextActive]}>
                {km === 0 ? "All" : `≤ ${km} km`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick filters + Map View at the end */}
        <View style={{ flexDirection: "row", marginTop: 10, flexWrap: "wrap" }}>
          <TouchableOpacity
            onPress={() => setQuick(QUICK.NEAREST)}
            style={[styles.sortChip, quick === QUICK.NEAREST && styles.sortChipActive]}
          >
            <Text style={[styles.sortChipText, quick === QUICK.NEAREST && styles.sortChipTextActive]}>
              Nearest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setQuick(QUICK.OPENING)}
            style={[styles.sortChip, quick === QUICK.OPENING && styles.sortChipActive]}
          >
            <Text style={[styles.sortChipText, quick === QUICK.OPENING && styles.sortChipTextActive]}>
              Opening soon
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setQuick(QUICK.POPULAR)}
            style={[styles.sortChip, quick === QUICK.POPULAR && styles.sortChipActive]}
          >
            <Text style={[styles.sortChipText, quick === QUICK.POPULAR && styles.sortChipTextActive]}>
              Popular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("HealthCentersMap")}
            style={[styles.sortChip, { marginLeft: 0 }]}
          >
            <Text style={styles.sortChipText}>Map View</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={renderCenter}
          ListEmptyComponent={<Text>No centers found.</Text>}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadBase();
              }}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  banner: {
    paddingVertical: 60,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bannerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  bannerSub: { color: "#E6F6FF", marginTop: 4 },

  input: {
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },

  // chips
  pill: {
    backgroundColor: THEME.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 8,
  },
  pillActive: { backgroundColor: "#DBEAFE" },
  pillText: { color: THEME.pillText, fontWeight: "700" },
  pillTextActive: { color: "#1D4ED8" },

  sortChip: {
    backgroundColor: "#EEF2FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 8,
    marginTop: 8,
  },
  sortChipActive: { backgroundColor: "#DBEAFE" },
  sortChipText: { color: "#4338CA", fontWeight: "700" },
  sortChipTextActive: { color: "#1D4ED8" },

  // center card
  centerCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.line,
  },
  name: { fontSize: 16, fontWeight: "800" },
  distance: { color: THEME.subtext, fontWeight: "700" },
  addrLine: { color: THEME.subtext, marginTop: 4 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
  },
  status: { fontWeight: "800" },
  hours: { color: THEME.subtext, fontWeight: "700" },

  // retry
  retryBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
