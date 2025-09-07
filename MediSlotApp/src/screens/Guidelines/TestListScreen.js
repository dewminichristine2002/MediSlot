import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchTests } from "../../api/tests";

export default function TestListScreen({ route, navigation }) {
  const { category } = route.params || {};
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await fetchTests(category, q);
      setTests(data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, q]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1 }}>
      {/* simple search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} />
        <TextInput
          style={styles.input}
          placeholder="Search tests"
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
          onSubmitEditing={load}
        />
        <TouchableOpacity onPress={load}><Ionicons name="arrow-forward-circle-outline" size={22} /></TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading tests…</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 12 }}
          data={tests}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.rowCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("TestDetails", { id: item._id, name: item.name })}
            >
              <View style={styles.rowIcon}><Ionicons name="flask-outline" size={20} color="#1B9C85" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                {!!item.what && <Text numberOfLines={2} style={styles.rowSub}>{item.what}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={[styles.muted, { padding: 16 }]}>No tests found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 1
  },
  input: { flex: 1, paddingVertical: 6 },
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
    elevation: 1
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#EAF8F5"
  },
  rowTitle: { fontSize: 15, fontWeight: "600", color: "#0F4332" },
  rowSub: { fontSize: 12, color: "#64748b", marginTop: 2 }
});
