import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Linking,
  TouchableOpacity
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";                     // 👈 TTS
import { fetchTestById } from "../../api/tests";
import { useAuth } from "../../context/AuthContext";
import { saveChecklistForTest } from "../../api/userChecklist";
import { Alert } from "react-native";


const C = {
  bg: "#F9FAFB",
  text: "#0F172A",
  g1: "#2563EB",
  g2: "#06B6D4",
};

const Section = ({ title, onRead, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!onRead && (
        <TouchableOpacity
          onPress={onRead}
          style={styles.speakBtn}
          accessibilityLabel={`Read ${title}`}
        >
          <Ionicons name="volume-high-outline" size={18} color="#0ea5e9" />
        </TouchableOpacity>
      )}
    </View>
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

const UI = {
  en: {
    screenTop: "Test Details",
    loading: "Loading details…",
    notFound: "Not found.",
    what: "What is this test?",
    why: "Why is it done?",
    prep: "Preparation",
    during: "During the test",
    after: "After the test",
    checklist: "Checklist before booking",
    moreInfo: "Open more info",
    all: "All",
    readAll: "Read all",
    stop: "Stop",
  },
  si: {
    screenTop: "පරීක්ෂණ විස්තර",
    loading: "විස්තර පූරණය වෙමින්…",
    notFound: "සොයාගත නොහැකිවිනි.",
    what: "මෙම පරීක්ෂාව කුමක්ද?",
    why: "එය සිදු කරන්නේ ඇයි?",
    prep: "පූර්ව සූදානම",
    during: "පරීක්ෂා කාලයේදී",
    after: "පරීක්ෂාවෙන් පසු",
    checklist: "පරීක්ෂාවට පෙර පරීක්ෂා ලැයිස්තුව",
    moreInfo: "වැඩි විස්තර බලන්න",
    all: "සියල්ල",
    readAll: "සියල්ල කියවන්න",
    stop: "නවත්වන්න",
  }
};

export default function TestDetailsScreen({ route, navigation }) {
  const { id } = route.params || {};
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en"); // en | si
  const [speaking, setSpeaking] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [voiceId, setVoiceId] = useState(null);
  const L = UI[lang];
   const { user } = useAuth();

  // Load test
useEffect(() => {
  if (!id) return;
  (async () => {
    try {
      const fetched = await fetchTestById(id);
      setTest(fetched);
    } catch (e) {
      console.warn("[Error loading test]", e);
    } finally {
      setLoading(false);
    }
  })();
}, [id]);

  // Stop TTS when leaving the screen
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  // Pick a suitable voice for current language (if device has one)
  useEffect(() => {
    (async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const langPrefix = lang === "si" ? "si" : "en";
        const exactLK = voices?.find(v =>
          (v.language || v.identifier || "").toLowerCase().startsWith(`${langPrefix}-lk`)
        );
        const generic = voices?.find(v =>
          (v.language || "").toLowerCase().startsWith(langPrefix)
        );
        setVoiceId((exactLK?.identifier) || (generic?.identifier) || null);
      } catch {
        setVoiceId(null);
      }
    })();
  }, [lang]);
  const handleSaveChecklist = async () => {
    if (!user?._id) {
      navigation.navigate("Login");
      return;
    }
    try {
     await saveChecklistForTest({
        userId: user._id,
        testId: test.testId || test._id, // ✅ fallback to _id if needed
      });

      Alert.alert("✅ Saved!", "Checklist has been added to your profile.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not save checklist.");
    }
  };

  // Helpers to choose localized fields
  const si = test?.translations?.si || {};
  const pick = (base, siVal) => (lang === "si" ? (siVal ?? base) : base);
  const arrPick = (baseArr, siArr) => {
    const chosen = lang === "si" ? (siArr && siArr.length ? siArr : baseArr) : baseArr;
    return Array.isArray(chosen) ? chosen : [];
  };

  const name = pick(test?.name, si.name);
  const what = pick(test?.what, si.what);
  const why = pick(test?.why, si.why);
  const preparation = arrPick(test?.preparation, si.preparation);
  const during = arrPick(test?.during, si.during);
  const after = arrPick(test?.after, si.after);
  const checklist = Array.isArray(lang === "si" ? si.checklist : test?.checklist)
    ? (lang === "si" ? si.checklist : test?.checklist)
    : [];
  const mediaUrl = pick(test?.mediaUrl, si.mediaUrl);
  const category = test?.category;

  // Build a full text to read
  const makeFullText = () => {
    const parts = [
      `${L.screenTop}: ${name}`,
      what ? `${L.what}: ${what}` : "",
      why ? `${L.why}: ${why}` : "",
      preparation?.length ? `${L.prep}: ${preparation.join(", ")}` : "",
      during?.length ? `${L.during}: ${during.join(", ")}` : "",
      after?.length ? `${L.after}: ${after.join(", ")}` : "",
      checklist?.length ? `${L.checklist}: ${checklist.map(c => c?.label || c?.key).join(", ")}` : "",
    ];
    return parts.filter(Boolean).join(". ");
  };

  const speakText = async (text) => {
    try {
      await Speech.stop();
      if (!text) return;
      setSpeaking(true);
      Speech.speak(text, {
        language: lang === "si" ? "si-LK" : "en-US",
        rate,
        pitch,
        voice: voiceId || undefined,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    } catch {
      setSpeaking(false);
    }
  };

  const toggleReadAll = async () => {
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
    } else {
      speakText(makeFullText());
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>
                {L.screenTop}{"\n"}<Text style={styles.mediSlotTitle}>Loading…</Text>
              </Text>
            </View>
            {/* Language toggle only */}
            <TouchableOpacity onPress={() => setLang(prev => (prev === "en" ? "si" : "en"))} hitSlop={10}>
              <Ionicons name="language-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <ActivityIndicator size="large" color={C.g1} style={{ marginTop: 24 }} />
        <Text style={styles.muted}>{L.loading}</Text>
      </View>
    );
  }

  if (!test) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Text>{L.notFound}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>
              {L.screenTop}{"\n"}
              <Text style={styles.mediSlotTitle} numberOfLines={1}>{name}</Text>
            </Text>
          </View>

          {/* Language toggle only */}
          <TouchableOpacity onPress={() => setLang(prev => (prev === "en" ? "si" : "en"))} hitSlop={10}>
            <Ionicons name="language-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* TTS controls */}
      <View style={styles.ttsRow}>
        <TouchableOpacity
          style={[styles.ttsBtn, speaking && styles.ttsBtnActive]}
          onPress={toggleReadAll}
          accessibilityLabel={speaking ? L.stop : L.readAll}
        >
          <Ionicons name={speaking ? "stop-circle" : "play-circle"} size={22} color="#fff" />
          <Text style={styles.ttsBtnText}>{speaking ? L.stop : L.readAll}</Text>
        </TouchableOpacity>

        <View style={styles.rateGroup}>
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => setRate(r => Math.max(0.7, +(r - 0.1).toFixed(1)))}
            accessibilityLabel="Slower"
          >
            <Text style={styles.rateText}>–</Text>
          </TouchableOpacity>
          <Text style={styles.rateLabel}>{rate.toFixed(1)}x</Text>
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => setRate(r => Math.min(1.5, +(r + 0.1).toFixed(1)))}
            accessibilityLabel="Faster"
          >
            <Text style={styles.rateText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.headerCard}>
          <View style={styles.iconWrap}><Ionicons name="medkit-outline" size={28} color="#1B9C85" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{name}</Text>
            {!!category && <Text style={styles.chip}>{category}</Text>}
          </View>
        </View>

        {!!what && (
          <Section title={L.what} onRead={() => speakText(`${L.what}: ${what}`)}>
            <Text style={styles.body}>{what}</Text>
          </Section>
        )}

        {!!why && (
          <Section title={L.why} onRead={() => speakText(`${L.why}: ${why}`)}>
            <Text style={styles.body}>{why}</Text>
          </Section>
        )}

        <Section
          title={L.prep}
          onRead={() => preparation?.length && speakText(`${L.prep}: ${preparation.join(", ")}`)}
        >
          <Bullets items={preparation} />
        </Section>

        <Section
          title={L.during}
          onRead={() => during?.length && speakText(`${L.during}: ${during.join(", ")}`)}
        >
          <Bullets items={during} />
        </Section>

        <Section
          title={L.after}
          onRead={() => after?.length && speakText(`${L.after}: ${after.join(", ")}`)}
        >
          <Bullets items={after} />
        </Section>

        {!!checklist.length && (
          <Section
            title={L.checklist}
            onRead={() =>
              speakText(`${L.checklist}: ${checklist.map(c => c?.label || c?.key).join(", ")}`)
            }
          >
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
        <TouchableOpacity
  style={styles.saveBtn}
  onPress={handleSaveChecklist}
>
  <Text style={styles.saveTxt}>💾 Save Checklist</Text>
</TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "center",
    marginVertical: 16,
    shadowColor: "#22C55E",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3, // for Android shadow
  },
  saveTxt: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  header: {
    width: "100%", alignSelf: "stretch",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 22,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  headerRow: { marginTop: 46, flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#FFFFFF", lineHeight: 26 },
  mediSlotTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#6b7280", marginTop: 6 },

  /* TTS controls */
  ttsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10 },
  ttsBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#1D4ED8", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },
  ttsBtnActive: { backgroundColor: "#DC2626" },
  ttsBtnText: { color: "#fff", fontWeight: "700" },
  rateGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  rateBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  rateText: { color: "#0f172a", fontSize: 16, fontWeight: "800" },
  rateLabel: { color: "#0f172a", fontWeight: "700", minWidth: 44, textAlign: "center" },

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
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#115e59" },
  speakBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: "#F0F9FF" },

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
