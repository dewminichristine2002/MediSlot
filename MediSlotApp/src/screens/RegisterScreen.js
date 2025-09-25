// src/screens/RegisterScreen.js
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Alert,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import FormTextInput from '../components/FormTextInput';
import { registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

// ---------- Healthcare palette ----------
const C = {
  text: '#0F172A',
  sub: '#475569',
  border: '#E5E7EB',
  muted: '#94A3B8',
  error: '#EF4444',
  success: '#10B981',
  g1: '#2563EB', // blue
  g2: '#06B6D4', // cyan
  g3: '#10B981', // emerald (CTA blend)
  card: '#FFFFFF',
  bg: '#F9FAFB',
};

// ---------- Validation schema ----------
const schema = z
  .object({
    name: z.string().min(2, 'Enter your name'),
    email: z
      .string()
      .email('Invalid email')
      .refine((val) => val.includes('@') && val.includes('.com'), {
        message: 'Email must contain @ and .com',
      }),
    contact_no: z
      .string()
      .length(10, 'Contact number must be 10 digits')
      .regex(/^\d+$/, 'Contact number must contain only numbers'),
    address: z.string().optional(),
    password: z.string().min(5, 'Password must have at least 5 characters'),
    confirm: z.string().min(5, 'Password must have at least 5 characters'),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  });

export default function RegisterScreen({ navigation }) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Refs for "Next" focus flow
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const passRef = useRef(null);
  const confirmRef = useRef(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      contact_no: '',
      address: '',
      password: '',
      confirm: '',
    },
    mode: 'onChange',
  });

  // live hints
  const password = useWatch({ control, name: 'password' });
  const confirm = useWatch({ control, name: 'confirm' });
  const passOK = (password || '').length >= 5;
  const matchOK = !!password && !!confirm && password === confirm;

  const onSubmit = async (values) => {
    const payload = { ...values };
    delete payload.confirm;

    try {
      setLoading(true);
      const { data } = await registerApi(payload);
      await signIn({ token: data.token, user: data.user });

      navigation.getParent()?.navigate('HomeTab');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // edges=['top'] ensures we hug the top safe area — no extra gap
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* gradient header sits flush under the top bar */}
      <LinearGradient
        colors={[C.g1, C.g2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Create account</Text>
        <Text style={styles.headerSub}>Book your health tests with ease</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* gradient stroke card */}
              <LinearGradient
                colors={[C.g1, C.g2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardOutline}
              >
                <View style={styles.card}>
                  {/* Section label chip */}
                  <View style={styles.sectionChip}>
                    <Ionicons name="person-circle-outline" size={16} color={C.g1} />
                    <Text style={styles.sectionText}>Your details</Text>
                  </View>

                  {/* Name */}
                  <Controller
                    name="name"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <FormTextInput
                        label="Full Name"
                        value={value}
                        onChangeText={onChange}
                        error={errors.name?.message}
                        returnKeyType="next"
                        onSubmitEditing={() => emailRef.current?.focus?.()}
                      />
                    )}
                  />

                  {/* Email */}
                  <Controller
                    name="email"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <FormTextInput
                        label="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={value}
                        onChangeText={onChange}
                        error={errors.email?.message}
                        inputRef={emailRef}
                        returnKeyType="next"
                        onSubmitEditing={() => phoneRef.current?.focus?.()}
                      />
                    )}
                  />

                  {/* Contact */}
                  <Controller
                    name="contact_no"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <FormTextInput
                        label="Contact Number"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={value}
                        onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                        error={errors.contact_no?.message}
                        inputRef={phoneRef}
                        returnKeyType="next"
                        onSubmitEditing={() => addressRef.current?.focus?.()}
                      />
                    )}
                  />

                  {/* Address */}
                  <Controller
                    name="address"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <FormTextInput
                        label="Address"
                        value={value}
                        onChangeText={onChange}
                        inputRef={addressRef}
                        returnKeyType="next"
                        onSubmitEditing={() => passRef.current?.focus?.()}
                      />
                    )}
                  />

                  {/* Password */}
                  <Controller
                    name="password"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.field}>
                        <FormTextInput
                          label="Password"
                          secureTextEntry={!showPassword}
                          value={value}
                          onChangeText={onChange}
                          error={errors.password?.message}
                          inputRef={passRef}
                          returnKeyType="next"
                          onSubmitEditing={() => confirmRef.current?.focus?.()}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword((s) => !s)}
                          style={styles.eye}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={22}
                            color={C.muted}
                          />
                        </TouchableOpacity>
                        <Text style={[styles.hint, { color: passOK ? C.success : C.muted }]}>
                          • At least 5 characters
                        </Text>
                      </View>
                    )}
                  />

                  {/* Confirm */}
                  <Controller
                    name="confirm"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.field}>
                        <FormTextInput
                          label="Confirm Password"
                          secureTextEntry={!showConfirm}
                          value={value}
                          onChangeText={onChange}
                          error={errors.confirm?.message}
                          inputRef={confirmRef}
                          returnKeyType="done"
                          onSubmitEditing={handleSubmit(onSubmit)}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirm((s) => !s)}
                          style={styles.eye}
                        >
                          <Ionicons
                            name={showConfirm ? 'eye-off' : 'eye'}
                            size={22}
                            color={C.muted}
                          />
                        </TouchableOpacity>
                        {!!password && !!confirm && (
                          <Text style={[styles.hint, { color: matchOK ? C.success : C.error }]}>
                            {matchOK ? 'Passwords match' : 'Passwords do not match'}
                          </Text>
                        )}
                      </View>
                    )}
                  />

                  {/* CTA */}
                  <TouchableOpacity
                    disabled={!isValid || loading}
                    onPress={handleSubmit(onSubmit)}
                    activeOpacity={0.9}
                    style={{ borderRadius: 12, overflow: 'hidden', opacity: !isValid || loading ? 0.7 : 1 }}
                  >
                    <LinearGradient
                      colors={[C.g1, C.g3]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cta}
                    >
                      <Text style={styles.ctaText}>{loading ? 'Creating…' : 'Register'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <Pressable onPress={() => navigation.goBack()} style={styles.loginRow}>
                    <Text style={styles.loginText}>
                      Already have an account? <Text style={styles.loginLink}>Login</Text>
                    </Text>
                  </Pressable>
                </View>
              </LinearGradient>

              <Text style={styles.footerNote}>
                By continuing, you agree to our Terms & Privacy Policy.
              </Text>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------- Styles ----------
const R = 18;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,         // small, comfy padding (no extra gaps)
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    marginTop: -60,       // 🔑 remove any top margin
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 0.3,marginTop:70, },
  headerSub: { color: 'rgba(255,255,255,0.92)', marginTop: 6 },

  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 }, // no top margin; we sit right under header
  scrollBody: { paddingBottom: 40 },

  // gradient outline + inner card
  cardOutline: {
    borderRadius: R + 2,
    padding: 2,
    marginTop: 0,     // sits tight under header
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

  field: { marginBottom: 16, position: 'relative' },
  eye: { position: 'absolute', right: 10, top: 36 },
  hint: { fontSize: 12, marginTop: 4 },

  cta: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },

  loginRow: { marginTop: 16, alignItems: 'center' },
  loginText: { color: C.sub },
  loginLink: { color: C.g1, fontWeight: '700' },

  footerNote: {
    textAlign: 'center',
    color: C.muted,
    fontSize: 12,
    marginTop: 16,
  },
});
