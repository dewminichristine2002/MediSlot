import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { formatAddress } from "../utils/format";

const THEME = {
  card: "#fff",
  text: "#0F172A",
  sub: "#6B7280",
  line: "#E5E7EB",
  goodBg: "#ECFDF5",
  goodFg: "#065F46",
  warnBg: "#FEF3C7",
  warnFg: "#92400E",
  fullBg: "#FEE2E2",
  fullFg: "#991B1B",
};

function availabilityBadge(center) {
  // heuristic: if open and has distance within 10km → "Good"; otherwise "Limited"
  const open = center?.isOpenNow;
  const near = center?.distanceKm != null && center.distanceKm <= 10;
  const status = open && near ? "Good availability" : open ? "Limited" : "Closed now";
  const colors =
    status === "Good availability" ? { bg: THEME.goodBg, fg: THEME.goodFg }
    : status === "Limited"        ? { bg: THEME.warnBg, fg: THEME.warnFg }
    : { bg: THEME.fullBg, fg: THEME.fullFg };
  return { status, ...colors };
}

export default function CenterCard({ center, onPress }) {
  const addr = formatAddress(center.address);
  const b = availabilityBadge(center);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Text style={styles.title}>{center.name}</Text>
      <Text style={styles.addr}>{addr}</Text>
      <View style={[styles.badge, { backgroundColor: b.bg }]}>
        <Text style={{ color: b.fg, fontWeight: "700" }}>{b.status}</Text>
        {center.distanceKm != null && (
          <Text style={{ color: b.fg, marginLeft: 8 }}>
            {center.distanceKm.toFixed(1)} km
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  title: { fontSize: 17, fontWeight: "800", color: THEME.text, marginBottom: 4 },
  addr: { color: THEME.sub, marginBottom: 10 },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
});
