// src/screens/Guidelines/TestDetailsScreen.js
import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Linking, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchTestById } from "../../api/tests";

const UI_STR = {
  en: {
    what: "What is this test?",
    why: "Why is it done?",
    prep: "Preparation",
    during: "During the test",
    after: "After the test",
    checklist: "Checklist before booking",
    moreInfo: "Open more info",
    notFound: "Not found.",
    loading: "Loading details…",
    siLabel: "සිංහල",
    enLabel: "English"
  },
  si: {
    what: "මෙම පරීක්ෂාව කුමක්ද?",
    why: "මෙය කරනුයේ මින් මක්ද?",
    prep: "පූර්ව සූදානම",
    during: "පරීක්ෂා කාලයේදී",
    after: "පරීක්ෂාවෙන් පසු",
    checklist: "පරීක්ෂාවට පෙර පරීක්ෂා ලැයිස්තුව",
    moreInfo: "වැඩි විස්තර බලන්න",
    notFound: "සොයාගත නොහැකිවිනි.",
    loading: "විස්තර පූරණය වෙමින්…",
    siLabel: "සිංහල",
    enLabel: "English"
  }
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Bullets = ({ items }) => {
  if (!items || !items.length) return null;
  return items.map((v, i) => (
    <View key={i} style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{v}</Text>
    </View>
  ));
};

export default function TestDetailsScreen({ route, navigation }) {
  const { id } = route.params || {};
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en"); // "en" | "si"

useLayoutEffect(() => {
  navigation.setOptions({
    headerRight: () => (
      <TouchableOpacity
        onPress={() => setLang(prev => (prev === "en" ? "si" : "en"))}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8 }}
        accessibilityLabel="Toggle language"
      >
        <Ionicons name="language-outline" size={18} color="#1B9C85" />
        <Text style={{ color: "#1B9C85", fontWeight: "600" }}>
          {lang === "en" ? "සිංහල" : "English"}
        </Text>
      </TouchableOpacity>
    ),
  });
}, [navigation, lang]);


  useEffect(() => {
    (async () => {
      try {
        setTest(await fetchTestById(id));
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const L = UI_STR[lang];

  // Helper: get localized field with graceful fallback to English/base fields
  const pick = (base, si) => (lang === "si" ? (si ?? base) : base);
  const arrPick = (baseArr, siArr) => {
    const chosen = lang === "si" ? (siArr && siArr.length ? siArr : baseArr) : baseArr;
    return Array.isArray(chosen) ? chosen : [];
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>{L.loading}</Text>
      </View>
    );
  }

  if (!test) {
    return (
      <View style={styles.center}>
        <Text>{L.notFound}</Text>
      </View>
    );
  }

  const si = test.translations?.si || {};
  const name = pick(test.name, si.name);
  const what = pick(test.what, si.what);
  const why = pick(test.why, si.why);
  const preparation = arrPick(test.preparation, si.preparation);
  const during = arrPick(test.during, si.during);
  const after = arrPick(test.after, si.after);
  const checklist = Array.isArray(lang === "si" ? si.checklist : test.checklist)
    ? (lang === "si" ? si.checklist : test.checklist)
    : [];
  const mediaUrl = pick(test.mediaUrl, si.mediaUrl);
  const category = test.category; // could localize category too later

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerCard}>
        <View style={styles.iconWrap}><Ionicons name="medkit-outline" size={28} color="#1B9C85" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{name}</Text>
          {!!category && <Text style={styles.chip}>{category}</Text>}
        </View>
      </View>

      {!!what && (
        <Section title={L.what}>
          <Text style={styles.body}>{what}</Text>
        </Section>
      )}

      {!!why && (
        <Section title={L.why}>
          <Text style={styles.body}>{why}</Text>
        </Section>
      )}

      <Section title={L.prep}>
        <Bullets items={preparation} />
      </Section>

      <Section title={L.during}>
        <Bullets items={during} />
      </Section>

      <Section title={L.after}>
        <Bullets items={after} />
      </Section>

      {!!checklist.length && (
        <Section title={L.checklist}>
          {checklist.map((c, i) => (
            <View key={i} style={styles.checkRow}>
              <Ionicons
                name={c.isMandatory ? "checkbox-outline" : "square-outline"}
                size={18}
                color={c.isMandatory ? "#16a34a" : "#64748b"}
              />
              <Text style={styles.checkText}>{c.label || c.key}</Text>
            </View>
          ))}
        </Section>
      )}

      {!!mediaUrl && (
        <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(mediaUrl)}>
          <Ionicons name="document-text-outline" size={18} color="#0ea5e9" />
          <Text style={styles.linkText}>{L.moreInfo}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#6b7280", marginTop: 6 },
  headerCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", padding: 16, borderRadius: 16, elevation: 1, marginBottom: 12
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center", backgroundColor: "#EAF8F5"
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0F4332" },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "#E6F7F3",
    color: "#13795B",
    borderRadius: 999, marginTop: 6, fontSize: 12
  },
  section: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 12, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#115e59", marginBottom: 8 },
  body: { fontSize: 14, color: "#334155", lineHeight: 20 },
  bulletRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  bulletDot: { fontSize: 16, lineHeight: 20, color: "#1B9C85" },
  bulletText: { flex: 1, color: "#334155" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  checkText: { color: "#334155" },
  linkBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, backgroundColor: "#F0F9FF"
  },
  linkText: { color: "#0ea5e9", fontWeight: "600" }
});
