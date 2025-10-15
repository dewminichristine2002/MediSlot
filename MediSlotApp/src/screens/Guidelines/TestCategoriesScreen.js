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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fetchCategories } from "../../api/tests";
import { useFocusEffect } from "@react-navigation/native";

/* ---------------------------------------------------------------------- */
/*  COLORS & LANGUAGE TEXTS                                               */
/* ---------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------- */
/*  ICON HANDLER (ENGLISH + SINHALA AWARE)                                */
/* ---------------------------------------------------------------------- */
const iconFor = (cat) => {
  const k = (cat || "").toLowerCase().trim();

  // 🌬️ Respiratory / Lungs
  if (
    k.includes("respiratory") ||
    k.includes("lung") ||
    k.includes("lungs") ||
    k.includes("ආශ්වාස") || // Sinhala respiratory
    k.includes("ශ্বাস") ||
    k.includes("පැහැදිලි කිරීම")
  ) {
    return { lib: "mci", name: "lungs" };
  }

  // 🧠 Neurology / Brain
  if (
    k.includes("neurology") ||
    k.includes("brain") ||
    k.includes("මොළය") || // Sinhala brain
    k.includes("නරඹු") ||
    k.includes("මොළයේ")
  ) {
    return { lib: "mci", name: "brain" };
  }

  // ❤️ Cardiology
  if (k.includes("cardio") || k.includes("heart") || k.includes("හෘදය"))
    return { lib: "ion", name: "heart-outline" };

  // 🩸 Blood
  if (k.includes("blood") || k.includes("ලේ"))
    return { lib: "ion", name: "water-outline" };

  // 🧪 Urine
  if (k.includes("urine") || k.includes("මුත්‍රා"))
    return { lib: "ion", name: "beaker-outline" };

  // 🩻 Imaging / X-ray
  if (
    k.includes("x-ray") ||
    k.includes("image") ||
    k.includes("imaging") ||
    k.includes("රූප") ||
    k.includes("අරුණු")
  )
    return { lib: "ion", name: "images-outline" };

  // 🧫 Hormonal / Endocrine
  if (k.includes("hormonal") || k.includes("endocrine") || k.includes("හෝර්මෝන්"))
    return { lib: "ion", name: "flask-outline" };

  // 🧬 Pathology / Biochem
  if (k.includes("pathology") || k.includes("biochem") || k.includes("පැතොලොජි"))
    return { lib: "ion", name: "eyedrop-outline" };

  // 🧍‍♀️ Pregnancy / Female
  if (k.includes("pregnancy") || k.includes("ගර්භණී"))
    return { lib: "ion", name: "female-outline" };

  // 🧩 Pediatrics / Children
  if (k.includes("pediatric") || k.includes("ළමයි") || k.includes("දරුවන්"))
    return { lib: "ion", name: "happy-outline" };

  // Default
  return { lib: "ion", name: "medkit-outline" };
};

/* ---------------------------------------------------------------------- */
/*  MAIN COMPONENT                                                        */
/* ---------------------------------------------------------------------- */
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

  useFocusEffect(
    useCallback(() => {
      const state = navigation.getState();
      const thisRoute = state.routes.find((r) => r.name === "GuidelinesTab");
      const params = thisRoute?.state?.routes?.find(
        (r) => r.name === "TestCategories"
      )?.params;

      if (params?.openTestId) {
        setTimeout(() => {
          navigation.navigate("TestDetails", {
            id: params.openTestId,
            test: params.test,
            center: params.center,
            name: params.name,
          });
        }, 300);
      }
    }, [navigation])
  );

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

  /* ------------------------------------------------------------------ */
  /*  HEADER SECTION                                                    */
  /* ------------------------------------------------------------------ */
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

      {/* 🔍 Search bar inside header */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#fff" />
        <TextInput
          style={styles.searchInput}
          placeholder={L.search}
          placeholderTextColor="#E0E7FF"
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  /* ------------------------------------------------------------------ */
  /*  LOADING & CONTENT                                                 */
  /* ------------------------------------------------------------------ */
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
              {(() => {
                const icon = iconFor(item);
                return icon.lib === "mci" ? (
                  <MaterialCommunityIcons
                    name={icon.name}
                    size={28}
                    color="#1B9C85"
                  />
                ) : (
                  <Ionicons name={icon.name} size={28} color="#1B9C85" />
                );
              })()}
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

/* ---------------------------------------------------------------------- */
/*  STYLES                                                               */
/* ---------------------------------------------------------------------- */
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

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    marginTop: 12,
    gap: 6,
    width: "80%",
    alignSelf: "center",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 6,
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
