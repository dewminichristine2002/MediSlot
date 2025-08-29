import React from 'react';
import { TextInput, View, Text } from 'react-native';

export default function FormTextInput({ label, error, style, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={{ marginBottom: 6, fontWeight: '600' }}>{label}</Text> : null}
      <TextInput
        style={[
          {
            borderWidth: 1,
            borderColor: error ? '#ff4d4f' : '#ccc',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
          },
          style,
        ]}
        placeholderTextColor="#888"
        {...props}
      />
      {error ? <Text style={{ color: '#ff4d4f', marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}
