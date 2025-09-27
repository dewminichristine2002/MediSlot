import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TestItem({ test }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{test.name}</Text>
        {test.prep && <Text style={styles.meta}>Prep: {test.prep}</Text>}
        {test.duration && <Text style={styles.meta}>Duration: {test.duration}</Text>}
      </View>
      {test.price && <Text style={styles.price}>Rs. {test.price}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  name: { fontSize: 15, fontWeight: "600" },
  meta: { color: "#666" },
  price: { fontWeight: "700" },
});
