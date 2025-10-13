import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { fetchCategories } from "../../api/tests";

const C = {
  bg: "#F9FAFB",
  text: "#0F172A",
  g1: "#2563EB",
  g2: "#06B6D4",
};

const UI = {
  en: {
    titleTop: "Lab Tests",
    titleBottom: "Categories",
    loading: "Loading categories…",
    empty: "No categories found.",
    view: "View tests",
    search: "Search category...",
  },
  si: {
    titleTop: "පරීක්ෂණ",
    titleBottom: "වර්ග",
    loading: "වර්ග පූරණය වෙමින්…",
    empty: "වර්ග කිසිවක් නොමැත.",
    view: "පරීක්ෂණ බලන්න",
    search: "වර්ග සොයන්න...",
  },
};

const iconFor = (cat) => {
  const k = (cat || "").toLowerCase();
  if (k.includes("blood")) return "water-outline";
  if (k.includes("urine")) return "beaker-outline";
  if (k.includes("x-ray") || k.includes("image")) return "images-outline";
  if (k.includes("cardio")) return "heart-outline";
  return "medkit-outline";
};

export default function TestCategoriesScreen({ navigation }) {
  const [cats, setCats] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lang, setLang] = useState("en");
  const [search, setSearch] = useState("");
  const L = UI[lang];

  const load = useCallback(async () => {
    try {
      const data = await fetchCategories(lang);
      setCats(data);
      setFiltered(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLang = () => setLang((prev) => (prev === "en" ? "si" : "en"));

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(cats);
    } else {
      const lower = text.toLowerCase();
      setFiltered(cats.filter((cat) => cat.toLowerCase().includes(lower)));
    }
  };

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
            <Text style={styles.mediSlotTitle}>{L.titleBottom}</Text>
          </Text>
        </View>

        <TouchableOpacity onPress={toggleLang} hitSlop={10}>
          <Ionicons name="language-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Header />
        <View style={{ paddingTop: 40 }}>
          <ActivityIndicator size="large" color={C.g1} />
          <Text style={styles.muted}>{L.loading}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />

      {/* 🌈 Styled Search Bar */}
      <LinearGradient
        colors={["#ffffff", "#f0f9ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.searchOuter}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#2563EB" />
          <TextInput
            style={styles.searchInput}
            placeholder={L.search}
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <FlatList
        contentContainerStyle={styles.gridWrap}
        data={filtered}
        numColumns={2}
        keyExtractor={(item, idx) => item + idx}
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
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("TestList", { category: item })}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={iconFor(item)} size={28} color="#1B9C85" />
            </View>
            <Text style={styles.cardTitle}>{item}</Text>
            <Text style={styles.cardHint}>{L.view}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.muted}>{L.empty}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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

searchOuter: {
  marginHorizontal: 16,
  marginTop: 10, // ⬅️ lifts it slightly below the header curve
  borderRadius: 16,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 3 },
},

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#0F172A",
  },

  gridWrap: { padding: 16 },
  center: { flex: 1, alignItems: "center" },
  card: {
    flex: 1,
    margin: 8,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    alignItems: "center",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF8F5",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F4332",
    textAlign: "center",
  },
  cardHint: { marginTop: 4, fontSize: 12, color: "#6b7280" },
  muted: { color: "#6b7280", marginTop: 8, textAlign: "center" },
});
