import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchCategories } from "../../api/tests";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCats(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading categories…</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.gridWrap}
      data={cats}
      numColumns={2}
      keyExtractor={(item, idx) => item + idx}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
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
          <Text style={styles.cardHint}>View tests</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.muted}>No categories found.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  gridWrap: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#EAF8F5", marginBottom: 10
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#0F4332", textAlign: "center" },
  cardHint: { marginTop: 4, fontSize: 12, color: "#6b7280" },
  muted: { color: "#6b7280", marginTop: 8 }
});
