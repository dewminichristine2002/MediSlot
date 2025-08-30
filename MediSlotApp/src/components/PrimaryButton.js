import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

export default function PrimaryButton({ title, onPress, disabled, loading }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: disabled ? '#cbd5e1' : '#2563eb',
        paddingVertical: 14,
        borderRadius: 12,
        opacity: pressed ? 0.9 : 1,
        alignItems: 'center',
      })}
    >
      {loading ? <ActivityIndicator /> : <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{title}</Text>}
    </Pressable>
  );
}
