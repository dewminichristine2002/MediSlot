// src/screens/EventRegisterScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getApiBaseUrl } from "../api/config";
import { useAuth } from "../context/AuthContext";
import FormTextInput from "../components/FormTextInput";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

/* --- Theme --- */
const C = {
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#0F172A",
  sub: "#475569",
  border: "#E5E7EB",
  primary: "#2563EB",
  g1: "#2563EB",
  g2: "#06B6D4",
  g3: "#10B981",
  muted: "#94A3B8",
  error: "#EF4444",
};

/* --- Validation --- */
const nicOld = /^[0-9]{9}[vVxX]$/;
const nicNew = /^[0-9]{12}$/;
const isValidNIC = (raw) => {
  if (!raw) return false;
  const s = String(raw).trim();
  return nicOld.test(s) || nicNew.test(s);
};
const normalizePhone = (s) => String(s || "").replace(/\s+/g, "");
const phoneOk = (p) => /^(\+94\d{9}|0\d{9})$/.test(normalizePhone(p));

const schema = z.object({
  name: z.string().transform((v) => v?.trim() ?? "").pipe(
    z.string().min(2, "Please enter your full name")
  ),
  nic: z.string().transform((v) => (v ?? "").toUpperCase().trim()).refine(isValidNIC, {
    message: "Invalid NIC (e.g., 123456789V or 200012345678)",
  }),
  gender: z.enum(["Male", "Female"]).optional(),
  age: z
    .string()
    .transform((v) => Number(String(v || "").replace(/[^\d]/g, "")))
    .pipe(
      z
        .number({ invalid_type_error: "Age must be a number" })
        .int()
        .min(1, "Age is required")
        .max(120, "Invalid age")
    ),
  contact: z
    .string()
    .transform((v) => (v ?? "").trim())
    .refine((v) => phoneOk(v), {
      message: "Enter a valid Sri Lanka number (+94XXXXXXXXX or 0XXXXXXXXX)",
    }),
  email: z.union([z.string().email("Invalid email"), z.literal(""), z.undefined()]).optional(),
  address: z.union([z.string().max(120, "Address is too long"), z.literal(""), z.undefined()]).optional(),
});

/* --- Strings --- */
const STRINGS = {
  en: {
    title: "Register for Event",
    eventDateAt: (d, t) => `${new Date(d).toLocaleDateString()} • ${t || "-"}`,
    notLoggedIn: "You’re not logged in. Please login again to register for events.",
    preparing: "Preparing…",
    fullName: "Full Name*",
    nic: "NIC*",
    gender: "Gender",
    male: "Male",
    female: "Female",
    age: "Age*",
    contact: "Contact Number*",
    email: "Email",
    address: "Address",
    submit: "Submit",
    login: "Login",
  },
};

/* --- Gender chips --- */
function GenderChips({ t, value, onChange, error }) {
  const options = [
    { key: "Male", label: t.male },
    { key: "Female", label: t.female },
  ];
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.inputLabel}>{t.gender}</Text>
      <View style={styles.genderRow}>
        {options.map((o) => {
          const active = value === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(active ? undefined : o.key)}
              style={[styles.genderChip, active && styles.genderChipActive]}
            >
              <Text style={[styles.genderChipText, active && styles.genderChipTextActive]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

/* --- Screen --- */
export default function EventRegisterScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const event = route.params?.event;

  const { user, token, loading: authLoading } = useAuth(); // 👈 useAuth supplies token

  const [lang, setLang] = useState("en");
  const t = STRINGS[lang];

  const [submitting, setSubmitting] = useState(false);

  const defaultValues = useMemo(
    () => ({ name: "", nic: "", gender: undefined, age: "", contact: "", email: "", address: "" }),
    []
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  async function saveRegistrationLocally(reg) {
    try {
      const key = "my_event_regs";
      const existing = await AsyncStorage.getItem(key);
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(reg);
      await AsyncStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.warn("Failed to save local registration:", e);
    }
  }

  const onSubmit = async (values) => {
    if (!event?._id) {
      Alert.alert("Error", "Missing event id.");
      return;
    }
    if (!token) {
      Alert.alert("Unauthorized", "Please login again.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/event-registrations/events/${event._id}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...values,
            patient_id: user?._id || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Registration failed");

      const reg = data?.registration || data?.doc || data;
      const localReg = { ...reg, event, patient: { ...values, _id: user?._id } };
      await saveRegistrationLocally(localReg);

      Alert.alert("Success", "Registration confirmed!", [
        { text: "View in Profile", onPress: () => navigation.navigate("Profile") },
        { text: "OK", onPress: () => navigation.navigate("FreeEventsTab", { screen: "FreeEvents" }) },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ marginTop: 10, color: C.sub }}>{t.preparing}</Text>
      </View>
    );
  }

  // Not logged in → show login message + redirect
 if (!token) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[styles.center, { padding: 24 }]}>
          <Ionicons
            name="lock-closed"
            size={48}
            color={C.primary}
            style={{ marginBottom: 16 }}
          />
          <Text
            style={{
              fontSize: 18,
              textAlign: "center",
              color: C.text,
              marginBottom: 24,
              fontWeight: "600",
            }}
          >
            {t.notLoggedIn}
          </Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("FreeEventsTab", { screen: "FreeEvents" })
            }
            style={{ borderRadius: 12, overflow: "hidden", width: "80%" }}
          >
            <LinearGradient
              colors={[C.g1, C.g3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "800",
                  letterSpacing: 0.5,
                }}
              >
                ← Back to Free Events
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  // --- Logged in form ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "left", "right"]}>
      <LinearGradient colors={[C.g1, C.g2]} style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>{t.title}</Text>
        </View>
        {event?.name && <Text style={styles.headerSub}>{event.name}</Text>}
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
            {/* Form */}
            <LinearGradient colors={[C.g1, C.g2]} style={styles.formOutline}>
              <View style={styles.formCard}>
                {/* Fields */}
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { value, onChange } }) => (
                    <FormTextInput
                      label={t.fullName}
                      value={value}
                      onChangeText={onChange}
                      placeholder="John Doe"
                      error={errors.name?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="nic"
                  render={({ field: { value, onChange } }) => (
                    <FormTextInput
                      label={t.nic}
                      value={value}
                      onChangeText={(txt) => onChange((txt || "").toUpperCase())}
                      placeholder="123456789V or 200012345678"
                      error={errors.nic?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { value, onChange } }) => (
                    <GenderChips t={t} value={value} onChange={onChange} error={errors.gender?.message} />
                  )}
                />
                <Controller
                  control={control}
                  name="age"
                  render={({ field: { value, onChange } }) => (
                    <FormTextInput
                      label={t.age}
                      value={String(value ?? "")}
                      onChangeText={onChange}
                      keyboardType="number-pad"
                      placeholder="30"
                      error={errors.age?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="contact"
                  render={({ field: { value, onChange } }) => (
                    <FormTextInput
                      label={t.contact}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="phone-pad"
                      placeholder="+94 7X XXX XXXX or 0XX XXX XXXX"
                      error={errors.contact?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { value, onChange } }) => (
                    <FormTextInput
                      label={t.email}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      placeholder="name@example.com"
                      error={errors.email?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { value, onChange } }) => (
                    <FormTextInput
                      label={t.address}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Street, City"
                      error={errors.address?.message}
                    />
                  )}
                />

                <Pressable
                  onPress={handleSubmit(onSubmit)}
                  disabled={submitting}
                  style={{ borderRadius: 12, overflow: "hidden", opacity: submitting ? 0.7 : 1, marginTop: 8 }}
                >
                  <LinearGradient colors={[C.g1, C.g3]} style={styles.cta}>
                    <Text style={styles.ctaText}>{submitting ? "Submitting..." : t.submit}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* --- Styles --- */
const R = 18;
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 22, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginTop: -60 },
  headerTop: { flexDirection: "row", alignItems: "center", marginTop: 70 },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)", marginRight: 8 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "900" },
  headerSub: { color: "rgba(255,255,255,0.92)", marginTop: 8, fontWeight: "700" },
  scrollBody: { padding: 16, paddingBottom: 32 },
  formOutline: { borderRadius: R + 2, padding: 1.5, marginTop: 6 },
  formCard: { backgroundColor: "#fff", borderRadius: R, padding: 16 },
  inputLabel: { fontWeight: "700", marginBottom: 6, color: C.text },
  genderRow: { flexDirection: "row", gap: 10 },
  genderChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1, borderColor: C.border },
  genderChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  genderChipText: { color: C.text, fontWeight: "800" },
  genderChipTextActive: { color: "#fff" },
  errorText: { color: C.error, marginTop: 4 },
  cta: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
