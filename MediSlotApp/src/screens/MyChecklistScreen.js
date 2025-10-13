import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { getMyChecklists } from "../api/userChecklist";
import { getApiBaseUrl } from "../api/config";

// ✅ Theme colors (same as TestCategoriesScreen)
const C = {
  bg: "#F9FAFB",
  text: "#0F172A",
  g1: "#2563EB",
  g2: "#06B6D4",
};

// ✅ Header copied exactly from TestCategoriesScreen
const Header = ({ navigation, lang, setLang }) => {
  const UI = {
    en: { titleTop: "My", titleBottom: "Checklist" },
    si: { titleTop: "මගේ", titleBottom: "පරීක්ෂණ ලයිස්තුව" },
  };
  const L = UI[lang];

  return (
    <LinearGradient
      colors={[C.g1, C.g2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>
            {L.titleTop}
            {"\n"}
            <Text style={styles.mediSlotTitle}>{L.titleBottom}</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setLang((prev) => (prev === "en" ? "si" : "en"))}
          hitSlop={10}
        >
          <Ionicons name="language-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default function MyChecklistScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en");
  const BASE = `${getApiBaseUrl()}/api/user-checklist`;

  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const res = await getMyChecklists(user._id);
        setData(res);
      } catch (err) {
        console.error("Checklist load failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleToggle = async (itemId, stepKey, currentValue) => {
    try {
      const res = await fetch(`${BASE}/${itemId}/items/${stepKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: !currentValue }),
      });
      if (!res.ok) throw new Error("Failed to toggle");

      const updated = data.map((c) =>
        c._id === itemId
          ? {
              ...c,
              items: c.items.map((it) =>
                it.key === stepKey ? { ...it, value: !currentValue } : it
              ),
              completedCount: !currentValue
                ? c.completedCount + 1
                : c.completedCount - 1,
            }
          : c
      );
      setData(updated);
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  // ✅ Loading / empty states
  if (!user?._id)
    return (
      <View style={styles.wrapper}>
        <Header navigation={navigation} lang={lang} setLang={setLang} />
        <View style={styles.center}>
          <Text style={styles.loginMsg}>
            Please log in to view your checklists.
          </Text>
        </View>
      </View>
    );

  if (loading)
    return (
      <View style={styles.wrapper}>
        <Header navigation={navigation} lang={lang} setLang={setLang} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.g1} />
        </View>
      </View>
    );

  if (!data.length)
    return (
      <View style={styles.wrapper}>
        <Header navigation={navigation} lang={lang} setLang={setLang} />
        <View style={styles.center}>
          <Text style={styles.empty}>No saved checklists yet.</Text>
        </View>
      </View>
    );

  // ✅ Main render
  return (
    <View style={styles.wrapper}>
      <Header navigation={navigation} lang={lang} setLang={setLang} />

      <ScrollView contentContainerStyle={styles.container}>
        {data.map((item) => (
          <View key={item._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="flask-outline" size={22} color={C.g1} />
              <View style={{ flex: 1 }}>
                <Text style={styles.testName}>
                  {item.test?.name || "Unknown Test"}
                </Text>
                <Text style={styles.category}>{item.test?.category}</Text>
              </View>
            </View>

            <View style={styles.progressBox}>
              <Ionicons name="checkbox-outline" size={20} color="#22c55e" />
              <Text style={styles.progress}>
                {item.completedCount}/{item.totalCount} completed
              </Text>
            </View>

            {item.items?.map((step, i) => (
              <TouchableOpacity
                key={i}
                style={styles.itemRow}
                onPress={() => handleToggle(item._id, step.key, step.value)}
              >
                <Ionicons
                  name={step.value ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={step.value ? "#22c55e" : "#9ca3af"}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.itemText,
                    step.value && {
                      textDecorationLine: "line-through",
                      color: "#6b7280",
                    },
                  ]}
                >
                  {step.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* ✅ FIXED: Properly nested “View Details” button */}
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() =>
                navigation.navigate("GuidelinesTab", {
                  screen: "TestDetails",
                  params: {
                    testId: item.testId,
                    name: item.test?.name,
                  },
                })
              }
            >
              <Text style={styles.viewTxt}>View Details</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: { marginTop: 46, flexDirection: "row", alignItems: "center" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 26,
  },
  mediSlotTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF" },

  container: { padding: 16, paddingTop: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loginMsg: { fontSize: 16, color: "#475569", marginTop: 10 },
  empty: { fontSize: 16, color: "#6b7280", marginTop: 10 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  testName: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  category: { color: "#64748b", fontSize: 14 },
  progressBox: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  progress: { fontSize: 14, color: "#22c55e", marginLeft: 6 },
  itemRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  itemText: { fontSize: 15, color: "#0f172a" },
  viewBtn: {
    marginTop: 12,
    backgroundColor: C.g1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  viewTxt: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
