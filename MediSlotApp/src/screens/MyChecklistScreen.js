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

// ✅ Healthcare gradient theme (same as other screens)
const C = {
  g1: "#0284c7",
  g2: "#06b6d4",
  text: "#0f172a",
  sub: "#475569",
};

// ✅ Header component (copied from your other pages)
const Header = ({ navigation, lang, setLang }) => (
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
          My{" "}
          <Text style={styles.mediSlotTitle}>
            Checklist
          </Text>
        </Text>
      </View>

      {/* Language toggle only */}
      <TouchableOpacity
        onPress={() => setLang((prev) => (prev === "en" ? "si" : "en"))}
        hitSlop={10}
      >
        <Ionicons name="language-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  </LinearGradient>
);

export default function MyChecklistScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en"); // ✅ same toggle behavior
  const BASE = `${getApiBaseUrl()}/api/user-checklist`;

  // ✅ Load saved checklists
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

  // ✅ Handle tick / untick
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
          <Text style={styles.loginMsg}>Please log in to view your checklists.</Text>
        </View>
      </View>
    );

  if (loading)
    return (
      <View style={styles.wrapper}>
        <Header navigation={navigation} lang={lang} setLang={setLang} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
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
              <Ionicons name="flask-outline" size={22} color="#0284c7" />
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

            {/* ✅ Tick / Untick checklist items */}
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

            {/* ✅ View Details button */}
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
    backgroundColor: "#f9fafb",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  mediSlotTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  container: {
    padding: 16,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loginMsg: {
    fontSize: 16,
    color: "#475569",
    marginTop: 10,
  },
  empty: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 10,
  },
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  testName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  category: {
    color: "#64748b",
    fontSize: 14,
  },
  progressBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  progress: {
    fontSize: 14,
    color: "#22c55e",
    marginLeft: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  itemText: {
    fontSize: 15,
    color: "#0f172a",
  },
  viewBtn: {
    marginTop: 12,
    backgroundColor: "#0284c7",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  viewTxt: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
