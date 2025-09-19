// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import FormTextInput from '../components/FormTextInput';
import PrimaryButton from '../components/PrimaryButton';
import { loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const { data } = await loginApi(values.email, values.password);

      // update auth context
      await signIn({ token: data.token, user: data.user });

      // ensure Home tab/stack selected and remove Login from history
      navigation.getParent()?.navigate('HomeTab');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 24 }}>
        Welcome back
      </Text>

      {/* Email */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <FormTextInput
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onChangeText={onChange}
            error={errors.email?.message}
          />
        )}
      />

      {/* Password with eye toggle */}
      <View style={{ position: 'relative' }}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <FormTextInput
              label="Password"
              secureTextEntry={!showPassword}
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
            />
          )}
        />

        <Pressable
          onPress={() => setShowPassword((s) => !s)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          hitSlop={10}
          style={{
            position: 'absolute',
            right: 12,
            // Adjust this "top" to match your FormTextInput vertical spacing.
            // If your input has a taller label, you may tweak this (e.g., 34–40).
            top: 36,
            padding: 4,
          }}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={22}
          />
        </Pressable>
      </View>

      <PrimaryButton title="Login" onPress={handleSubmit(onSubmit)} loading={loading} />

      <Pressable
        onPress={() => navigation.navigate('Register')}
        style={{ marginTop: 16, alignItems: 'center' }}
      >
        <Text>
          New here?{' '}
          <Text style={{ color: '#2563eb', fontWeight: '700' }}>
            Create an account
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}
