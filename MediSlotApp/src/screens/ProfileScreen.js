import React from 'react';
import { View, Text } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={{ flex:1, padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 16 }}>My Profile</Text>
      <Text style={{ marginBottom: 6 }}>Name: {user?.name}</Text>
      <Text style={{ marginBottom: 6 }}>Email: {user?.email}</Text>
      <Text style={{ marginBottom: 6 }}>Phone: {user?.contact_no}</Text>
      <Text style={{ marginBottom: 6 }}>Role: {user?.user_category}</Text>
      <Text style={{ marginBottom: 20 }}>Address: {user?.address}</Text>

      
    </View>
  );
}
