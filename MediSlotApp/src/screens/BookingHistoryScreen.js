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

const keyOf = (b) => `${b.scheduledDate}|${b.scheduledTime}`;

export default function BookingHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  // server filters
  const [scope, setScope] = useState("upcoming"); // upcoming | past | all
  const [pMethod, setPMethod] = useState("all"); // all | online | pay_at_center
  const [pStatus, setPStatus] = useState("all"); // all | paid | unpaid

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (scope !== "all") params.scope = scope;
      if (pMethod !== "all") params.paymentMethod = pMethod;
      if (pStatus !== "all") params.paymentStatus = pStatus;

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
  }, [scope, pMethod, pStatus]);

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
          backgroundColor: on ? "#e8f0fe" : "#fff",
          borderColor: on ? "#2563eb" : "#e5e7eb",
        },
      ]}
    >
      <Text style={{ fontWeight: "700" }}>{children}</Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient header (same vibe as Free Events / NewBooking) */}
      <LinearGradient colors={["#2563eb", "#06b6d4"]} style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>
          {list.length} {list.length === 1 ? "booking" : "bookings"}
        </Text>
      </LinearGradient>

      <View style={{ padding: 16 }}>
        <Text style={styles.label}>Filters</Text>

        {/* scope */}
        <View style={styles.rowWrap}>
          {["upcoming", "past", "all"].map((s) => (
            <Chip key={s} on={scope === s} onPress={() => setScope(s)}>
              {s}
            </Chip>
          ))}
        </View>

        {/* payment method */}
        <View style={styles.rowWrap}>
          {["all", "online", "pay_at_center"].map((s) => (
            <Chip key={s} on={pMethod === s} onPress={() => setPMethod(s)}>
              {s}
            </Chip>
          ))}
        </View>

        {/* payment status */}
        <View style={styles.rowWrap}>
          {["all", "paid", "unpaid"].map((s) => (
            <Chip key={s} on={pStatus === s} onPress={() => setPStatus(s)}>
              {s}
            </Chip>
          ))}
        </View>

        <FlatList
          data={list}
          keyExtractor={(b) => b._id}
          contentContainerStyle={{ gap: 12, paddingTop: 4, paddingBottom: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  #{item.appointment_no}
                </Text>

                {/* availability-ish badge style for status */}
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

              <Text style={styles.muted}>
                📅 {item.scheduledDate}  ⏰ {item.scheduledTime}
              </Text>

              {/* items */}
              {item.items?.map((it, i) => (
                <Text key={i} style={{ marginTop: 6 }}>
                  • {it.name} — LKR {it.price}
                </Text>
              ))}

              <View style={styles.footerRow}>
                <Text style={{ fontWeight: "700" }}>
                  Total: LKR {item.price}
                </Text>
                <View style={styles.methodPill}>
                  <Text style={{ fontWeight: "700", color: "#0c4a6e" }}>
                    {item.payment?.method === "online" ? "Online" : "Pay at center"}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No bookings.
            </Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "#e0f2fe" },

  label: { fontWeight: "700", marginTop: 12, marginBottom: 8 },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
  },

  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbeafe", // light blue border like the screenshot
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  muted: { color: "#6b7280", marginBottom: 4 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },

  footerRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  methodPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e0f2fe",
  },
});
