// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import FormTextInput from '../components/FormTextInput';
import PrimaryButton from '../components/PrimaryButton';
import { loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

// --- Healthcare palette (same as Register)
const C = {
  text: '#0F172A',
  sub: '#475569',
  border: '#E5E7EB',
  muted: '#94A3B8',
  error: '#EF4444',
  success: '#10B981',
  g1: '#2563EB', // blue
  g2: '#06B6D4', // cyan
  g3: '#10B981', // emerald
  card: '#FFFFFF',
  bg: '#F9FAFB',
};

// --- Validation (UX-aligned)
const schema = z.object({
  email: z
    .string()
    .email('Invalid email')
    .refine((v) => v.includes('@') && v.includes('.com'), {
      message: 'Email must contain @ and .com',
    }),
  password: z.string().min(5, 'Password must have at least 5 characters'),
});

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange', // real-time validation
  });

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const { data } = await loginApi(values.email, values.password);
      await signIn({ token: data.token, user: data.user });

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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Gradient header */}
      <LinearGradient
        colors={[C.g1, C.g2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Welcome back</Text>
        <Text style={styles.headerSub}>Sign in to manage your health bookings</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}   // 👈 fills remaining height
            >
              {/* Body fills screen: card at top, footer at bottom */}
              <View style={styles.body}>
                {/* Gradient outline + inner card */}
                <LinearGradient
                  colors={[C.g1, C.g2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardOutline}
                >
                  <View style={styles.card}>
                    {/* Section chip */}
                    <View style={styles.sectionChip}>
                      <Ionicons name="log-in-outline" size={16} color={C.g1} />
                      <Text style={styles.sectionText}>Account access</Text>
                    </View>

                    {/* Email */}
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, value } }) => (
                        <FormTextInput
                          label="Email"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          textContentType="emailAddress"
                          value={value}
                          onChangeText={onChange}
                          error={errors.email?.message}
                          returnKeyType="next"
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
                            textContentType="password"
                            autoComplete="password"
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit(onSubmit)}
                          />
                        )}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword((s) => !s)}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={styles.eye}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={22}
                          color={C.muted}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                      disabled={!isValid || loading}
                      onPress={handleSubmit(onSubmit)}
                      activeOpacity={0.9}
                      style={{
                        borderRadius: 12,
                        overflow: 'hidden',
                        opacity: !isValid || loading ? 0.7 : 1,
                        marginTop: 8,
                      }}
                    >
                      <LinearGradient
                        colors={[C.g1, C.g3]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cta}
                      >
                        <Text style={styles.ctaText}>{loading ? 'Signing in…' : 'Login'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>

                {/* Footer links pinned to bottom of body */}
                <Pressable
                  onPress={() => navigation.navigate('Register')}
                  style={styles.switchRow}
                >
                  <Text style={styles.switchText}>
                    New here? <Text style={styles.switchLink}>Create an account</Text>
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles
const R = 18;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginTop:-60,
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 0.3 ,marginTop:70,},
  headerSub: { color: 'rgba(255,255,255,0.92)', marginTop: 6 },

  container: { flex: 1, paddingHorizontal: 16, paddingTop: 0 },

  // 👇 This spreads the content to fill the page
  scrollBody: { flexGrow: 1, paddingBottom: 24,},

  // The body takes up remaining space and pushes footer to bottom
  body: {
    flexGrow: 1,
    justifyContent: 'space-between',
    marginTop:80
  },

  cardOutline: {
    borderRadius: R + 2,
    padding: 2,
    
  },
  card: {
    backgroundColor: C.card,
    borderRadius: R,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    
  },

  sectionChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  sectionText: { color: C.g1, fontWeight: '700', fontSize: 12 },

  eye: { position: 'absolute', right: 10, top: 36 },
  cta: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },

  // Footer pinned to bottom of the filled page
  switchRow: { marginTop: 16, alignItems: 'center', paddingBottom: 12 },
  switchText: { color: C.sub, marginBottom:60 },
  switchLink: { color: C.g1, fontWeight: '700' },
});
