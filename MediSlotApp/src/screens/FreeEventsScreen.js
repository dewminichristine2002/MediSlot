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
import { getApiBaseUrl } from "../api/config";

const C = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  text: "#0F172A",
  sub: "#64748B",
  border: "#E5E9F2",
  primary: "#2563EB",
  primarySoft: "#EEF2FF",
  ok: "#10B981",
  warn: "#F59E0B",
  danger: "#EF4444",
  track: "#E5E7EB",
};

export default function FreeEventsScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | today | week | free

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
    const base = events.filter((ev) => {
      // textual query
      const text =
        `${ev?.name ?? ""} ${ev?.location ?? ""} ${ev?.description ?? ""}`.toLowerCase();
      if (q && !text.includes(q)) return false;

      // date filters
      const d = ev?.date ? new Date(ev.date) : null;
      if (!d || isNaN(d)) return filter === "all" ? true : false;

      if (filter === "today") return isSameDay(d, new Date());
      if (filter === "week") return isThisWeek(d);
      if (filter === "free") {
        const total = ev?.slots_total || 0;
        const filled = ev?.slots_filled || 0;
        return total - filled > 0;
      }
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
    if (remaining <= 10 && remaining > 0) {
      badgeStyle = styles.badgeWarn;
      badgeText = "Filling fast";
    }
    if (remaining === 0) {
      badgeStyle = styles.badgeDanger;
      badgeText = "Fully booked. Join Wait List";
    }

    return (
      <Pressable
        onPress={() => openRegister(item)}
        android_ripple={{ color: "#E8EDFF" }}
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.99 }] },
        ]}
      >
        {/* Title row */}
        <View style={styles.rowBetween}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={[styles.badge, badgeStyle]}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        </View>

        {/* Date / Time / Location */}
        <View style={styles.metaWrap}>
          <Text style={styles.meta}>
            📅 {formatDate(item.date)} {item?.time ? `• ${item.time}` : ""}
          </Text>
          {!!item.location && <Text style={styles.meta}>       {item.location}</Text>}
        </View>

        {!!item.description && (
          <Text style={styles.desc} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        {/* Slots + remaining */}
        <View style={styles.slotsRow}>
          <Text style={styles.slotsText}>
            Slots: <Text style={styles.slotsStrong}>{filled}/{total}</Text>
          </Text>
          <Text
            style={[
              styles.remaining,
              remaining === 0
                ? { color: C.danger }
                : remaining <= 10
                ? { color: C.warn }
                : { color: C.ok },
            ]}
          >
            {remaining > 0 ? `${remaining} left` : "No slots"}
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, pct * 100)}%` },
            ]}
          />
        </View>

        {/* CTA row */}
        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>Register now</Text>
          <Text style={styles.chev}>›</Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading events…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>      Book Your Free Events</Text>
      <CountLine />

      {/* Search + Filters */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search by name, location…"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      <View style={styles.filters}>
        {[
          { key: "all", label: "All" },
          { key: "today", label: "Today" },
          { key: "week", label: "This week" },
          { key: "free", label: "Free slots" },
        ].map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                active && { backgroundColor: C.primary, borderColor: C.primary },
              ]}
            >
              <Text style={[styles.chipText, active && { color: "#fff" }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🗓️</Text>
          <Text style={styles.emptyTitle}>No events match your filters</Text>
          <Text style={styles.emptyDesc}>
            Try clearing the search or switching filters to see more events.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: C.bg },
  title: { fontSize: 26, fontWeight: "900", color: C.text, marginTop: 6 },
  subtitle: { color: C.sub, marginTop: 4, marginBottom: 10, fontWeight: "600" },

  // Search
  searchBox: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 2,
    marginBottom: 10,
  },
  input: {
    color: C.text,
    fontSize: 15,
    paddingVertical: 8,
  },

  // Filters
  filters: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: { color: C.text, fontWeight: "700", fontSize: 12 },

  listContent: { paddingBottom: 28 },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  name: { fontSize: 18, fontWeight: "800", color: C.text, flex: 1, paddingRight: 10 },

  metaWrap: { marginTop: 6, gap: 2 },
  meta: { color: C.sub, fontSize: 13,fontWeight: '700' },

  desc: { marginTop: 10, color: "#334155", lineHeight: 20, fontSize: 14 },

  // Badges
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  badgeOk: { backgroundColor: "#ECFDF5", borderColor: "#CFFAE6" },
  badgeWarn: { backgroundColor: "#FFF7E6", borderColor: "#FFE3B3" },
  badgeDanger: { backgroundColor: "#FEE2E2", borderColor: "#F9C6C6" },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#0F172A" },

  // Slots/progress
  slotsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, alignItems: "center" },
  slotsText: { color: C.sub, fontWeight: "700" },
  slotsStrong: { color: C.text },
  remaining: { fontWeight: "800" },

  progressTrack: {
    height: 10,
    backgroundColor: C.track,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.primary,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },

  ctaRow: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ctaText: { color: C.primary, fontWeight: "800" },
  chev: { color: C.primary, fontSize: 22, marginTop: -2 },

  // Loading / Empty
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, fontSize: 14, color: C.sub },

  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.text, marginBottom: 6 },
  emptyDesc: { color: C.sub, textAlign: "center" },
});
