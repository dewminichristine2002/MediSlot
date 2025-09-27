import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getHealthAwarenessOne, toAbsolute } from "../api/healthAwareness";

const C = {
  bg: "#F9FAFB",
  text: "#0F172A",
  sub: "#475569",
  border: "#E5E7EB",
  g1: "#2563EB",
  g2: "#06B6D4",
  primary: "#2563EB",
};

export default function HealthAwarenessDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getHealthAwarenessOne(id);
        setDoc(data);
      } catch (e) {
        console.warn("Detail load error:", e?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[s.screen, s.center]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!doc) {
    return (
      <View style={[s.screen, s.center]}>
        <Text style={{ color: C.text }}>Not found</Text>
      </View>
    );
  }

  const cover = doc.imageUrl ? toAbsolute(doc.imageUrl) : null;

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

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ paddingHorizontal: 16 }}>
          {cover && <Image source={{ uri: cover }} style={s.cover} />}

          <Text style={s.title}>{doc.title}</Text>

          <View style={s.badgesRow}>
            <Badge text={(doc.severity || "info").toUpperCase()} tone="severity" />
            {!!doc.category && <Badge text={doc.category} />}
            {!!doc.region && <Badge text={doc.region} />}
          </View>

       {!!doc.summary && <Text style={s.summary}>{doc.summary}</Text>}
       {!!doc.description && (
           <Text style={[s.summary, { marginTop: 10 }]}>{doc.description}</Text>
        )}

          {!!doc.mediaUrl && (
            <Pressable onPress={() => Linking.openURL(doc.mediaUrl)} style={{ marginTop: 16 }}>
              <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ctaBtn}>
                <Text style={s.ctaTxt}>Open resource</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Badge({ text, tone }) {
  const tones = {
    severity: { bg: "#f3b7b7ff", fg: "#991b1b" },
    default: { bg: "#EEF2FF", fg: "#1E3A8A" },
  };
  const c = tones[tone] || tones.default;
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.badgeTxt, { color: c.fg }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    width: "100%",
    alignSelf: "stretch",
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 12,
  },
  headerRow: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
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

  cover: { width: "100%", height: 220, borderRadius: 16, backgroundColor: "#EEF2FF", marginBottom: 14 },

  title: { color: C.text, fontWeight: "900", fontSize: 22, marginTop: 4 },

  badgesRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 8, marginBottom: 8 },
  badgeTxt: { fontWeight: "700", fontSize: 12 },

  summary: { color: "#334155", marginTop: 12, lineHeight: 20 },

  ctaBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  ctaTxt: { color: "#fff", fontWeight: "800" },
});
