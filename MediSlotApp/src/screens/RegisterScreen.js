import React, { useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import FormTextInput from '../components/FormTextInput';
import PrimaryButton from '../components/PrimaryButton';
import { registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email(),
  contact_no: z.string().min(10, 'Enter a valid phone'),
  address: z.string().optional(),
  password: z.string().min(6),
  confirm: z.string().min(6),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
});

export default function RegisterScreen({ navigation }) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', contact_no: '', address: '',
      password: '', confirm: '',
    },
  });

  const onSubmit = async (values) => {
    const payload = { ...values };
    delete payload.confirm; // never send confirm
    try {
      setLoading(true);
      const { data } = await registerApi(payload); // no user_category sent
      await signIn({ token: data.token, user: data.user });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed';
      Alert.alert('Error', msg);
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, padding: 20, marginTop: 10 }}>
      <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 16 }}>Create account</Text>

      <Controller name="name" control={control} render={({ field:{onChange, value} }) => (
        <FormTextInput label="Full Name" value={value} onChangeText={onChange} error={errors.name?.message} />
      )}/>

      <Controller name="email" control={control} render={({ field:{onChange, value} }) => (
        <FormTextInput label="Email" keyboardType="email-address" autoCapitalize="none"
          value={value} onChangeText={onChange} error={errors.email?.message} />
      )}/>

      <Controller name="contact_no" control={control} render={({ field:{onChange, value} }) => (
        <FormTextInput label="Contact Number" keyboardType="phone-pad"
          value={value} onChangeText={onChange} error={errors.contact_no?.message} />
      )}/>

      <Controller name="address" control={control} render={({ field:{onChange, value} }) => (
        <FormTextInput label="Address (optional)" value={value} onChangeText={onChange} />
      )}/>

      <Controller name="password" control={control} render={({ field:{onChange, value} }) => (
        <FormTextInput label="Password" secureTextEntry
          value={value} onChangeText={onChange} error={errors.password?.message} />
      )}/>

      <Controller name="confirm" control={control} render={({ field:{onChange, value} }) => (
        <FormTextInput label="Confirm Password" secureTextEntry
          value={value} onChangeText={onChange} error={errors.confirm?.message} />
      )}/>

      <PrimaryButton title="Register" onPress={handleSubmit(onSubmit)} loading={loading} />

      <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16, alignItems: 'center' }}>
        <Text>Already have an account? <Text style={{ color:'#2563eb', fontWeight:'700' }}>Login</Text></Text>
      </Pressable>
    </View>
  );
}
