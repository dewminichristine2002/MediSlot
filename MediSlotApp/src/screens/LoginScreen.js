import React, { useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const { data } = await loginApi(values.email, values.password);
      await signIn({ token: data.token, user: data.user });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 24 }}>Welcome back</Text>

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

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <FormTextInput
            label="Password"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />

      <PrimaryButton title="Login" onPress={handleSubmit(onSubmit)} loading={loading} />

      <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text>
          New here? <Text style={{ color: '#2563eb', fontWeight: '700' }}>Create an account</Text>
        </Text>
      </Pressable>
    </View>
  );
}
