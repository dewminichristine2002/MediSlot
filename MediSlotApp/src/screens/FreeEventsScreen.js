// src/screens/FreeEventsScreen.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiBaseUrl } from "../api/config";

// 💙 App theme (matches Register/Login)
const C = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#0F172A",
  sub: "#475569",
  border: "#E5E7EB",
  // gradients & brand
  g1: "#2563EB",   // blue
  g2: "#06B6D4",   // cyan
  g3: "#10B981",   // emerald (accent)
  primary: "#2563EB",
  // states
  ok: "#10B981",
  warn: "#F59E0B",
  danger: "#EF4444",
  // ui
  track: "#E5E7EB",
};

export default function FreeEventsScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | today | week | month | free

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/events`);
      const data = await res.json();
      setEvents(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const openRegister = (event) => {
    navigation.navigate("EventRegister", { event });
  };

  // ---------- Helpers ----------
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isThisWeek = (d) => {
    const now = new Date();
    const day = now.getDay(); // 0-6
    const diffToMonday = (day + 6) % 7; // make Monday=0
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return d >= monday && d <= sunday;
  };

  const isThisMonth = (d) => {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDate = (s) => {
    const d = new Date(s);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today0 = startOfToday();

    const base = events.filter((ev) => {
      // textual query
      const text = `${ev?.name ?? ""} ${ev?.location ?? ""} ${ev?.description ?? ""}`.toLowerCase();
      if (q && !text.includes(q)) return false;

      // valid date required
      const d = ev?.date ? new Date(ev.date) : null;
      if (!d || isNaN(d)) return false;

      // 🚫 hide past events (strictly before today)
      const d0 = new Date(d);
      d0.setHours(0, 0, 0, 0);
      if (d0 < today0) return false;

      // apply filter chips
      if (filter === "today") return isSameDay(d, new Date());
      if (filter === "week") return isThisWeek(d);
      if (filter === "month") return isThisMonth(d);
      if (filter === "free") {
        const total = ev?.slots_total || 0;
        const filled = ev?.slots_filled || 0;
        return total - filled > 0;
      }

      // "all" -> keep today and future
      return true;
    });

    // sort: nearest date first, then by name
    return base.sort((a, b) => {
      const ad = a?.date ? new Date(a.date).getTime() : Infinity;
      const bd = b?.date ? new Date(b.date).getTime() : Infinity;
      if (ad !== bd) return ad - bd;
      return (a?.name || "").localeCompare(b?.name || "");
    });
  }, [events, query, filter]);

  const CountLine = () => (
    <Text style={styles.subtitle}>
      {filtered.length} {filtered.length === 1 ? "event" : "events"} available
    </Text>
  );

  const renderItem = ({ item }) => {
    const total = item.slots_total || 0;
    const filled = item.slots_filled || 0;
    const remaining = Math.max(0, total - filled);
    const pct = total > 0 ? filled / total : 0;

    let badgeStyle = styles.badgeOk;
    let badgeText = "Good availability";
    let badgeIcon = "checkmark-circle";
    if (remaining <= 10 && remaining > 0) {
      badgeStyle = styles.badgeWarn;
      badgeText = "Filling fast";
      badgeIcon = "alert-circle";
    }
    if (remaining === 0) {
      badgeStyle = styles.badgeDanger;
      badgeText = "Full • Join Wait List";
      badgeIcon = "close-circle";
    }

    const isFull = remaining === 0;

    return (
      <LinearGradient
        colors={[C.g1, C.g2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGrad}
      >
        <Pressable
          onPress={() => openRegister(item)}
          android_ripple={{ color: "#E8EDFF" }}  // light brand ripple
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          {/* FULL ribbon */}
          {isFull && (
            <View style={styles.ribbon}>
              <Text style={styles.ribbonText}>FULL</Text>
            </View>
          )}

          {/* top row: title + availability */}
          <View style={styles.rowBetween}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={[styles.badge, badgeStyle]}>
              <Ionicons name={badgeIcon} size={16} color={C.text} style={{ marginRight: 6 }} />
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          </View>

          {/* meta */}
          <View style={styles.metaGrid}>
            <Text style={styles.metaRow}>📅 {formatDate(item.date)}</Text>
            {!!item.time && <Text style={styles.metaRow}>⏰ {item.time}</Text>}
            {!!item.location && <Text style={styles.metaRow}>📍 {item.location}</Text>}
          </View>

          {!!item.description && (
            <Text style={styles.desc} numberOfLines={3}>
              {item.description}
            </Text>
          )}

          {/* capacity */}
          <View style={styles.slotsRow}>
            <Text style={styles.slotsText}>
              Slots: <Text style={styles.slotsStrong}>{filled}/{total}</Text>
            </Text>
            <Text
              style={[
                styles.remaining,
                isFull ? { color: C.danger } : remaining <= 10 ? { color: C.warn } : { color: C.ok },
              ]}
            >
              {isFull ? "No slots" : `${remaining} left`}
            </Text>
          </View>

          {/* gradient progress */}
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[C.g1, C.g2, C.g3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFillGrad, { width: `${Math.min(100, pct * 100)}%` }]}
            />
          </View>

          {/* CTA inside card */}
          <View style={styles.ctaRow}>
            <Text style={styles.ctaHint}>Get Your QR Code</Text>
            <LinearGradient
              colors={[C.g1, C.g3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.ctaPill, isFull && { opacity: 0.7 }]}
            >
              <Text style={styles.ctaPillText}>{isFull ? "Join Waitlist" : "Book"}</Text>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </LinearGradient>
          </View>
        </Pressable>
      </LinearGradient>
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading events…</Text>
          <Text style={styles.loadingSub}>If it’s slow, check your connection and try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* header */}
      <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Free Diagnostic Camps</Text>
        <CountLine />
      </LinearGradient>

      <View style={styles.container}>
        {/* search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={C.sub} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search village, clinic, test name…"
            placeholderTextColor={C.sub}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
        </View>

        {/* filters */}
        <View style={styles.filters}>
          {[
            { key: "all", label: "All" },
            { key: "today", label: "Today" },
            { key: "week", label: "This week" },
            { key: "month", label: "This month" },   // <-- NEW
            { key: "free", label: "Free slots" },
          ].map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* list */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🏥</Text>
            <Text style={styles.emptyTitle}>No camps found</Text>
            <Text style={styles.emptyDesc}>Try a different village or date filter.</Text>
            <Pressable onPress={onRefresh} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
              contentInset={{ bottom: 0 }}
                scrollIndicatorInsets={{ bottom: 0 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />
            }
          />
          
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -60, // pull header upward (overlap effect)
  },

  headerTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", marginTop: 70 },
  subtitle: { color: "rgba(255,255,255,0.92)", marginTop: 6, fontWeight: "700" },

  container: { flex: 1, padding: 16 },

  // search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    marginTop: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 16,
    paddingVertical: 8,
  },

  // filters
  filters: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipText: { color: C.text, fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#FFFFFF" },

  listContent: { paddingBottom: 28 },

  // gradient stroke wrapper for the card
  cardGrad: {
    borderRadius: 20,
    padding: 1.5,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  // card surface
  card: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 19,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.7)",
    overflow: "hidden",
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.98,
  },

  // FULL ribbon
  ribbon: {
    position: "absolute",
    top: 0,
    right: -40,
    backgroundColor: "rgba(239,68,68,0.95)", // danger
    paddingVertical: 4,
    paddingHorizontal: 50,
    transform: [{ rotate: "35deg" }],
    zIndex: 2,
  },
  ribbonText: { color: "#fff", fontWeight: "800", fontSize: 12, letterSpacing: 1 },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  name: { fontSize: 19, fontWeight: "900", color: C.text, flex: 1, paddingRight: 10 },

  metaGrid: { marginTop: 18, rowGap: 4 },
  metaRow: { color: C.sub, fontSize: 15, fontWeight: "700" },

  desc: { marginTop: 10, color: "#2F3E39", lineHeight: 20, fontSize: 14 },

  // badges
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeOk: { backgroundColor: "#ECFDF5", borderColor: "#CFFAE6" }, // emerald tint
  badgeWarn: { backgroundColor: "#FFF7E6", borderColor: "#FFE3B3" },
  badgeDanger: { backgroundColor: "#FEE2E2", borderColor: "#F9C6C6" },
  badgeText: { fontSize: 12, fontWeight: "900", color: C.text },

  // slots/progress
  slotsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, alignItems: "center" },
  slotsText: { color: C.sub, fontWeight: "800", fontSize: 14 },
  slotsStrong: { color: C.text },
  remaining: { fontWeight: "900", fontSize: 14 },

  progressTrack: {
    height: 10,
    backgroundColor: C.track,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFillGrad: {
    height: "100%",
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },

  // CTA row
  ctaRow: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ctaHint: { color: C.sub, fontWeight: "700" },
  ctaPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  ctaPillText: { color: "#FFFFFF", fontWeight: "900" },

  // loading / empty
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { marginTop: 10, fontSize: 15, color: C.sub, fontWeight: "700" },
  loadingSub: { marginTop: 4, fontSize: 12, color: C.sub },

  emptyWrap: { alignItems: "center", justifyContent: "center", marginTop: 48, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: C.text, marginBottom: 6 },
  emptyDesc: { color: C.sub, textAlign: "center", marginBottom: 12 },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: C.primary,
  },
  retryText: { color: "#fff", fontWeight: "800" },
});
