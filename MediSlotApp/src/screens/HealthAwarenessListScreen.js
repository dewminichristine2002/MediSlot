import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { listHealthAwareness, toAbsolute } from "../api/healthAwareness";

const C = {
  bg: "#F9FAFB",
  text: "#0F172A",
  sub: "#475569",
  border: "#E5E7EB",
  g1: "#2563EB",
  g2: "#06B6D4",
  primary: "#2563EB",
};

export default function HealthAwarenessListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listHealthAwareness();
        setItems(data || []);
      } catch (e) {
        console.warn("List load error:", e?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderItem = ({ item }) => {
    const thumb = item.imageUrl ? toAbsolute(item.imageUrl) : null;
    return (
      <Pressable
        onPress={() => navigation.navigate("HealthAwarenessDetail", { id: item._id })}
        style={s.card}
      >
        {thumb ? <Image source={{ uri: thumb }} style={s.thumb} /> : <View style={[s.thumb, s.thumbPh]} />}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={s.title}>{item.title}</Text>
          {!!item.summary && <Text numberOfLines={2} style={s.summary}>{item.summary}</Text>}
          <View style={s.metaRow}>
            {!!item.category && <Pill label={item.category} />}
            {!!item.region && <Pill label={item.region} />}
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={[s.screen, s.center]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      {/* FULL-WIDTH ROUNDED HEADER */}
      <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            android_ripple={{ color: "rgba(255,255,255,0.25)", radius: 22, borderless: true }}
            style={({ pressed }) => [s.backCircle, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>

          <Text style={s.headerTitle}>Health Awareness</Text>

          {/* spacer to keep title centered */}
          <View style={{ width: 44, height: 44 }} />
        </View>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
      />
    </View>
  );
}

function Pill({ label }) {
  return (
    <View style={s.pill}>
      <Text style={s.pillTxt}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: "center", justifyContent: "center" },

  header: {
    width: "100%",
    alignSelf: "stretch",
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
  },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: "#EEF2FF", marginRight: 12 },
  thumbPh: { opacity: 0.7 },

  title: { color: C.text, fontWeight: "900", fontSize: 16 },
  summary: { color: "#334155", marginTop: 4 },

  // wrap chips to next line (no overflow)
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  pill: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  pillTxt: { color: "#1E3A8A" },
});
