// MediSlotApp/src/screens/BookingHistoryScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { myBookingsApi } from "../api/bookings";

export default function BookingHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [scope, setScope] = useState("upcoming"); // upcoming | past | all

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (scope !== "all") params.scope = scope;

      const { data } = await myBookingsApi(params);

      const arr = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      setList(arr);
    } catch (e) {
      console.log("My bookings failed:", e?.response?.data || e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const Chip = ({ on, children, onPress }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: on ? "#2563eb" : "#fff",
          borderColor: on ? "#2563eb" : "#d1d5db",
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: on ? "#fff" : "#1f2937", fontWeight: on ? "700" : "500" },
        ]}
      >
        {children.charAt(0).toUpperCase() + children.slice(1)}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={["#2563eb", "#06b6d4"]} style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>
          {list.length} {list.length === 1 ? "booking" : "bookings"}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Filter Row */}
        <View style={styles.filterContainer}>
          {["upcoming", "past", "all"].map((s) => (
            <Chip key={s} on={scope === s} onPress={() => setScope(s)}>
              {s}
            </Chip>
          ))}
        </View>

        {/* Booking List */}
        <FlatList
          data={list}
          keyExtractor={(b) => b._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>No: {item.appointment_no}</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        item.payment?.status === "paid" ? "#dcfce7" : "#fef3c7",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color:
                        item.payment?.status === "paid" ? "#166534" : "#92400e",
                    }}
                  >
                    {item.payment?.status || "unknown"}
                  </Text>
                </View>
              </View>

              <Text style={styles.dateRow}>
                📅 {item.scheduledDate} ‧ ⏰ {item.scheduledTime}
              </Text>

              <View style={styles.itemsContainer}>
                {item.items?.map((it, i) => (
                  <Text key={i} style={styles.itemText}>
                    • {it.name} —{" "}
                    <Text style={styles.itemPrice}>LKR {it.price}</Text>
                  </Text>
                ))}
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.totalText}>Total: LKR {item.price}</Text>
                <View style={styles.methodPill}>
                  <Text style={styles.methodText}>
                    {item.payment?.method === "online"
                      ? "Online Payment"
                      : "Pay at Center"}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bookings found</Text>
              <Text style={styles.emptySubText}>
                Try switching between Upcoming or Past
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 14,
  },

  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14, color: "#e0f2fe" },

  content: { flex: 1, padding: 16 },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  chipText: { fontSize: 14, textTransform: "capitalize" },

  listContainer: { gap: 14, paddingBottom: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },

  dateRow: {
    marginTop: 6,
    color: "#475569",
    fontSize: 14,
  },

  itemsContainer: { marginTop: 8 },
  itemText: { color: "#334155", fontSize: 14, marginTop: 2 },
  itemPrice: { color: "#1e3a8a", fontWeight: "600" },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  totalText: { fontWeight: "700", color: "#111827", fontSize: 15 },
  methodPill: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  methodText: { color: "#0c4a6e", fontWeight: "600" },

  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#64748b" },
  emptySubText: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
});
