import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fetchTests } from "../../api/tests";

const C = {
  bg: "#F9FAFB",
  text: "#0F172A",
  g1: "#2563EB",
  g2: "#06B6D4",
};

const UI = {
  en: {
    titleTop: "Lab Tests",
    searchPh: "Search tests",
    loading: "Loading tests…",
    empty: "No tests found.",
  },
  si: {
    titleTop: "පරීක්ෂණ",
    searchPh: "පරීක්ෂණ සෙවුම්",
    loading: "පරීක්ෂණ පූරණය වෙමින්…",
    empty: "පරීක්ෂණ නොමැත.",
  },
};

export default function TestListScreen({ route, navigation }) {
  const { category } = route.params || {};
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("en");
  const L = UI[lang];

// inside TestListScreen.js
const load = useCallback(async () => {
  try {
    const data = await fetchTests({
      category,               // works if it's an English category
      category_si: category,  // works if it's a Sinhala category
      q,
      lang                    // tells backend to localize fields
    });
    setTests(data);
  } catch (e) {
    console.warn(e);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [category, q, lang]);

useEffect(() => {
  load();
}, [load]);


  const Header = () => (
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
            <Text style={styles.mediSlotTitle}>
              {category || (lang === "si" ? "සියල්ල" : "All")}
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

      {/* Search under header */}
{/* 🔍 Styled Search Bar */}
<View style={styles.searchContainer}>
  <Ionicons name="search-outline" size={20} color="#fff" />
  <TextInput
    style={styles.searchdewInput}
    placeholder={L.searchPh}
    placeholderTextColor="#E0E7FF"
    value={q}
    onChangeText={setQ}
    returnKeyType="search"
    onSubmitEditing={load}
  />
  {q.length > 0 && (
    <TouchableOpacity onPress={() => setQ("")}>
      <Ionicons name="close-circle" size={20} color="#fff" />
    </TouchableOpacity>
  )}
</View>

    </LinearGradient>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.g1} />
          <Text style={styles.muted}>{L.loading}</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 12 }}
          data={tests}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.rowCard}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("TestDetails", {
                  id: item._id,
                  name: item.name,
                })
              }
            >
              <View style={styles.rowIcon}>
                <Ionicons name="flask-outline" size={20} color="#1B9C85" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                {!!item.what && (
                  <Text numberOfLines={2} style={styles.rowSub}>
                    {item.what}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.muted, { padding: 16 }]}>{L.empty}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
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
  // 🌈 Styled search bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    marginTop: 12,
    gap: 6,
    width: "85%",          // 👈 adjust width (80–90% looks best)
    alignSelf: "center",
  },
  searchdewInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 6,
  },


  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#6b7280" },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F5",
  },
  rowTitle: { fontSize: 15, fontWeight: "600", color: "#0F4332" },
  rowSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
});
