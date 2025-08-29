import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FreeEventsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Free Events</Text>
      <Text>Show your free events list here.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
});
