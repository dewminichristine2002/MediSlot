import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { getMyChecklists } from "../api/userChecklist";
import { getApiBaseUrl } from "../api/config";

const C = {
  bg: "#F9FAFB",
  text: "#0F172A",
  g1: "#2563EB",
  g2: "#06B6D4",
};

// ✅ Gradient Header
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
  const [menuVisible, setMenuVisible] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const BASE = `${getApiBaseUrl()}/api/user-checklist`;

  // ✅ Fetch all user checklists
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

  // ✅ Toggle (tick / untick)
const handleToggle = async (itemId, stepKey, currentValue) => {
  try {
    const res = await fetch(`${BASE}/${itemId}/items/${stepKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: !currentValue }),
    });
    if (!res.ok) throw new Error("Failed to toggle");

    // Update state safely
    setData((prev) =>
      prev.map((c) => {
        if (c._id !== itemId) return c;

        // Toggle the target item
        const updatedItems = c.items.map((it) =>
          it.key === stepKey ? { ...it, value: !currentValue } : it
        );

        // Recalculate completedCount accurately
        const completedCount = updatedItems.filter((it) => it.value).length;

        return { ...c, items: updatedItems, completedCount };
      })
    );
  } catch (err) {
    console.error("Toggle failed:", err);
  }
};


  // ✅ Delete checklist (after confirmation)
  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`${BASE}/${selectedId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setData((prev) => prev.filter((c) => c._id !== selectedId));
      setConfirmVisible(false);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ✅ Empty / Loading / Not logged in
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

  // ✅ Main Render
  return (
    <View style={styles.wrapper}>
      <Header navigation={navigation} lang={lang} setLang={setLang} />

      <ScrollView contentContainerStyle={styles.container}>
        {data.map((item) => (
          <View key={item._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <Ionicons name="flask-outline" size={22} color={C.g1} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.testName}>
                    {lang === "si"
                      ? item.test?.translations?.si?.name || item.test?.name
                      : item.test?.name}
                  </Text>
                  <Text style={styles.category}>
                    {lang === "si"
                      ? item.test?.translations?.si?.category || item.test?.category
                      : item.test?.category}
                  </Text>
                </View>
              </View>

              {/* 3-dots */}
              <TouchableOpacity
                onPress={() =>
                  setMenuVisible(menuVisible === item._id ? null : item._id)
                }
                style={styles.menuBtn}
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#9ca3af" />
              </TouchableOpacity>

              {/* Popup Menu */}
              {menuVisible === item._id && (
                <View style={styles.popupMenu}>
                  <Pressable
                    onPress={() => {
                      setSelectedId(item._id);
                      setMenuVisible(null);
                      setConfirmVisible(true);
                    }}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && { backgroundColor: "#f3f4f6" },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={styles.menuItemText}>Remove</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Progress */}
            <View style={styles.progressBox}>
              <Ionicons name="checkbox-outline" size={20} color="#22c55e" />
              <Text style={styles.progress}>
                {item.completedCount}/{item.totalCount}{" "}
                {lang === "si" ? "නිමාවී ඇත" : "completed"}
              </Text>
            </View>

            {/* Steps list */}
            {item.items?.map((step, i) => {
              const siLabel =
                item.test?.translations?.si?.checklist?.find(
                  (c) => c.key === step.key
                )?.label || step.label;

              return (
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
                    {lang === "si" ? siLabel : step.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* View Details */}
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() =>
                navigation.navigate("GuidelinesTab", {
                  screen: "TestDetails",
                  params: {
                    id: item.test?._id || item.testId || item.test_id,
                    test: item.test,
                    name: item.test?.name,
                  },
                })
              }
            >
              <Text style={styles.viewTxt}>
                {lang === "si" ? "විස්තර බලන්න" : "View Details"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* ✅ Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons
              name="warning-outline"
              size={42}
              color="#f97316"
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.modalTitle}>
              {lang === "si" ? "පරීක්ෂණ ලයිස්තුව ඉවත් කරන්නද?" : "Remove Checklist?"}
            </Text>
            <Text style={styles.modalMsg}>
              {lang === "si"
                ? "මෙම පරීක්ෂණ ලයිස්තුව ඉවත් කිරීමට ඔබට අවශ්‍ය බව විශ්වාසද?"
                : "Are you sure you want to delete this checklist?"}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#e5e7eb" }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={{ color: "#374151" }}>
                  {lang === "si" ? "අවලංගු කරන්න" : "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#ef4444" }]}
                onPress={handleDelete}
              >
                <Text style={{ color: "#fff" }}>
                  {lang === "si" ? "ඉවත් කරන්න" : "Remove"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: C.bg },
  header: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: { marginTop: 46, flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#fff" },
  mediSlotTitle: { fontSize: 24, fontWeight: "900", color: "#fff" },
  container: { padding: 16 },
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  menuBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  popupMenu: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 9999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  menuItemText: { color: "#ef4444", fontSize: 14, fontWeight: "500" },
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

  // ✅ Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalMsg: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 8 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
});
