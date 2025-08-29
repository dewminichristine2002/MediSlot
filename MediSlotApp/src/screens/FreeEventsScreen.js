// src/screens/FreeEventsScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { getApiBaseUrl } from "../api/config"; // ensure src/api/config.js exists

export default function FreeEventsScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderItem = ({ item }) => {
    const total = item.slots_total || 0;
    const filled = item.slots_filled || 0;
    const remaining = Math.max(0, total - filled);
    const pct = total > 0 ? filled / total : 0;

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{item.name}</Text>

        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString()} at {item.time}
        </Text>

        <Text style={styles.location}>{item.location}</Text>

        {!!item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        {/* Slots info row */}
        <View style={styles.slotsRow}>
          <Text style={styles.slotsText}>
            Slots: {filled}/{total}
          </Text>
          <View
            style={[
              styles.badge,
              remaining <= 5 ? styles.badgeLow : styles.badgeOk,
            ]}
          >
            <Text style={styles.badgeText}>{remaining} left</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${Math.min(100, pct * 100)}%` }]}
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Free Events</Text>

      {events.length === 0 ? (
        <Text style={styles.emptyText}>No events found</Text>
      ) : (
        <FlatList
          data={events}
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
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, fontSize: 14, color: "#333" },

  emptyText: { fontSize: 14, color: "#666" },

  listContent: { paddingBottom: 24 },

  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2, // Android
    shadowColor: "#000", // iOS
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  name: { fontSize: 18, fontWeight: "bold", marginBottom: 4, color: "#111" },
  date: { fontSize: 14, color: "#333" },
  location: { fontSize: 14, color: "#666", marginTop: 2 },
  description: { marginTop: 8, fontSize: 14, color: "#444", lineHeight: 20 },

  slotsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  slotsText: { fontSize: 13, fontWeight: "600", color: "#333" },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeOk: { backgroundColor: "#E8F5E9" },
  badgeLow: { backgroundColor: "#FDECEA" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#333" },

  progressTrack: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#007AFF" },
});
