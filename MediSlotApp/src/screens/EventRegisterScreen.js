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

/* --- Theme (aligned with app) --- */
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

/* ---------- Validation helpers ---------- */
const nicOld = /^[0-9]{9}[vVxX]$/;          // e.g., 123456789V / 123456789X
const nicNew = /^[0-9]{12}$/;               // e.g., 200012345678
const isValidNIC = (raw) => {
  if (!raw) return false;
  const s = String(raw).trim();
  return nicOld.test(s) || nicNew.test(s);
};

const normalizePhone = (s) => String(s || "").replace(/\s+/g, ""); // drop spaces for validation
// Accept: +94XXXXXXXXX or 0XXXXXXXXX (exactly 9 digits after +94 or 10 digits starting 0)
const phoneOk = (p) => /^(\+94\d{9}|0\d{9})$/.test(normalizePhone(p));

/* --- Validation schema --- */
const schema = z.object({
  name: z
    .string()
    .transform((v) => v?.trim() ?? "")
    .pipe(z.string().min(2, "Please enter your full name")),
  nic: z
    .string()
    .transform((v) => (v ?? "").toUpperCase().trim())
    .refine(isValidNIC, { message: "Invalid NIC (e.g., 123456789V or 200012345678)" }),
  gender: z.enum(["Male", "Female"]).optional(),
  age: z
    .string()
    .transform((v) => Number(String(v || "").replace(/[^\d]/g, "")))
    .pipe(z.number({ invalid_type_error: "Age must be a number" }).int().min(1, "Age is required").max(120, "Invalid age")),
  contact: z
    .string()
    .transform((v) => (v ?? "").trim())
    .refine((v) => phoneOk(v), { message: "Enter a valid Sri Lanka number (+94XXXXXXXXX or 0XXXXXXXXX)" }),
  email: z
    .union([z.string().email("Invalid email"), z.literal(""), z.undefined()])
    .optional(),
  address: z.union([z.string().max(120, "Address is too long"), z.literal(""), z.undefined()]).optional(),
});

/* --- Tiny i18n --- */
const STRINGS = {
  en: {
    title: "Register for Event",
    eventDateAt: (d, t) => `${new Date(d).toLocaleDateString()} • ${t || "-"}`,
    notLoggedIn: "You’re not logged in. Please login again to register for events.",
    preparing: "Preparing…",
    fullName: "Full Name*",
    nic: "NIC*",
    gender: "Gender",
    selectGender: "Select gender",
    male: "Male",
    female: "Female",
    age: "Age*",
    contact: "Contact Number*",
    email: "Email",
    address: "Address",
    submit: "Submit",
  },
  si: {
    title: "සිදුවීමට ලියාපදිංචි වන්න",
    eventDateAt: (d, t) => `${new Date(d).toLocaleDateString()} • ${t || "-"}`,
    notLoggedIn: "ඔබ පිවිසුන තත්ත්වයේ නොමැත. සිදුවීම් සඳහා ලියාපදිංචි වීමට කරුණාකර නැවත පිවිසෙන්න.",
    preparing: "සකස් වෙමින්…",
    fullName: "සම්පූර්ණ නාමය*",
    nic: "ජාතික හැඳුනුම්පත් අංකය (NIC)*",
    gender: "ලිංගය",
    selectGender: "ලිංගය තෝරන්න",
    male: "පුරුෂ",
    female: "ස්ත්‍රී",
    age: "වයස*",
    contact: "දුරකථන අංකය*",
    email: "ඊමේල්",
    address: "ලිපිනය",
    submit: "යොමු කරන්න",
  },
  ta: {
    title: "நிகழ்ச்சிக்கு பதிவு செய்யவும்",
    eventDateAt: (d, t) => `${new Date(d).toLocaleDateString()} • ${t || "-"}`,
    notLoggedIn: "நீங்கள் உள்நுழையவில்லை. நிகழ்வுகளுக்கு பதிவு செய்ய மீண்டும் உள்நுழையவும்.",
    preparing: "தயாராக்கப்படுகிறது…",
    fullName: "முழுப் பெயர்*",
    nic: "தேசிய அடையாள அட்டை எண் (NIC)*",
    gender: "பால்",
    selectGender: "பால் தேர்வு செய்யவும்",
    male: "ஆண்",
    female: "பெண்",
    age: "வயது*",
    contact: "தொலைபேசி எண்*",
    email: "மின்னஞ்சல்",
    address: "முகவரி",
    submit: "சமர்ப்பிக்க",
  },
};

function resolveInitialLang() {
  const l = (Intl?.DateTimeFormat?.().resolvedOptions?.().locale || "en").toLowerCase();
  if (l.startsWith("si")) return "si";
  if (l.startsWith("ta")) return "ta";
  return "en";
}

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
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              hitSlop={8}
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

  const { user, loading: authLoading } = useAuth();

  const [lang, setLang] = useState(resolveInitialLang());
  const t = STRINGS[lang] || STRINGS.en;

  const [token, setToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const tk = await AsyncStorage.getItem("token");
        setToken(tk);
      } finally {
        setTokenLoading(false);
      }
    })();
  }, []);

  const [submitting, setSubmitting] = useState(false);

  const defaultValues = useMemo(
    () => ({
      name: "",
      nic: "",
      gender: undefined,
      age: "",
      contact: "",
      email: "",
      address: "",
    }),
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
    mode: "onChange",        // live validation feedback
    reValidateMode: "onBlur" // re-validate on blur too
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

      const localReg = {
        _id: reg?._id,
        status: reg?.status || data?.status || "confirmed",
        waitlist_position: reg?.waitlist_position ?? data?.waitlist_position ?? null,
        event: {
          _id: event._id,
          name: event.name,
          date: event.date,
          time: event.time,
          location: event.location,
        },
        patient: {
          _id: user?._id,
          name: values.name,
          nic: values.nic,
          gender: values.gender || null,
          age: values.age || null,
          contact: values.contact,
          email: values.email || "",
          address: values.address || "",
        },
        qrString: JSON.stringify({
          t: "event_reg",
          regId: reg?._id,
          eventId: event._id,
          userId: user?._id,
          name: values.name,
          nic: values.nic,
          ts: Date.now(),
        }),
        createdAt: new Date().toISOString(),
      };

      await saveRegistrationLocally(localReg);

      const msg =
        (reg?.status || data.status) === "waitlist"
          ? `You are added to the waitlist.\nPosition: ${
              reg?.waitlist_position ?? data?.waitlist_position ?? "TBD"
            }`
          : "Registration confirmed!";

      Alert.alert("Success", msg, [
        {
          text: "View in Profile",
          onPress: () => {
            reset(defaultValues);
            navigation.navigate("Profile");
          },
        },
        {
          text: "OK",
          onPress: () => {
            reset(defaultValues);
            navigation.navigate("FreeEventsTab", { screen: "FreeEvents" });
          },
        },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || tokenLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ marginTop: 10, color: C.sub }}>{t.preparing}</Text>
      </View>
    );
  }

  // No login button here (as requested)
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

          {/* Back to Free Events button */}
          <Pressable
            onPress={() =>
              navigation.navigate("FreeEventsTab", { screen: "FreeEvents" })
            }
            style={{ width: "80%", borderRadius: 12, overflow: "hidden" }}
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
                  letterSpacing: 0.3,
                }}
              >
                ← Back to Free Events
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "left", "right"]}>
      {/* Gradient header with custom back chevron */}
      <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>{t.title}</Text>
        </View>
        {event?.name ? (
          <Text style={styles.headerSub} numberOfLines={1}>
            {event.name}
          </Text>
        ) : null}
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Event summary card with gradient stroke */}
            {event && (
              <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.eventOutline}>
                <View style={styles.eventCard}>
                  <View style={styles.eventTopRow}>
                    <Text style={styles.eventName} numberOfLines={2}>
                      {event.name}
                    </Text>
                    <View style={styles.eventPill}>
                      <Ionicons name="shield-checkmark" size={14} color="#fff" />
                      <Text style={styles.eventPillText}>Free</Text>
                    </View>
                  </View>
                  <View style={styles.eventMetaRow}>
                    <Ionicons name="calendar" size={16} color={C.sub} />
                    <Text style={styles.eventMetaText}>{t.eventDateAt(event.date, event.time)}</Text>
                  </View>
                  {!!event.location && (
                    <View style={styles.eventMetaRow}>
                      <Ionicons name="location" size={16} color={C.sub} />
                      <Text style={styles.eventMetaText}>{event.location}</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            )}

            {/* Form card with gradient stroke */}
            <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.formOutline}>
              <View style={styles.formCard}>
                {/* Language chips */}
                <View style={styles.langRow}>
                  {[
                    { k: "en", label: "EN" },
                    { k: "si", label: "සිං" },
                    { k: "ta", label: "தமிழ்" },
                  ].map((o) => (
                    <Pressable
                      key={o.k}
                      onPress={() => setLang(o.k)}
                      style={[styles.langChip, lang === o.k && styles.langChipActive]}
                    >
                      <Text style={[styles.langChipText, lang === o.k && styles.langChipTextActive]}>{o.label}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Fields */}
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormTextInput
                      label={t.fullName}
                      value={value}
                      onChangeText={(txt) => onChange(txt)}
                      onBlur={onBlur}
                      placeholder="John Doe"
                      error={errors.name?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="nic"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormTextInput
                      label={t.nic}
                      value={value}
                      onChangeText={(txt) => onChange((txt || "").toUpperCase())}
                      onBlur={onBlur}
                      placeholder="123456789V or 200012345678"
                      error={errors.nic?.message}
                      autoCapitalize="characters"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { value, onChange } }) => (
                    <GenderChips t={STRINGS[lang]} value={value} onChange={onChange} error={errors.gender?.message} />
                  )}
                />

                <Controller
                  control={control}
                  name="age"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormTextInput
                      label={t.age}
                      value={String(value ?? "")}
                      onChangeText={(txt) => onChange(txt.replace(/[^\d]/g, ""))}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                      placeholder="30"
                      error={errors.age?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="contact"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormTextInput
                      label={t.contact}
                      value={value}
                      onChangeText={(txt) => onChange(txt.replace(/[^\d+ ]/g, ""))}
                      onBlur={onBlur}
                      keyboardType="phone-pad"
                      placeholder="+94 7X XXX XXXX or 0XX XXX XXXX"
                      error={errors.contact?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormTextInput
                      label={t.email}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      placeholder="name@example.com"
                      error={errors.email?.message}
                      autoCapitalize="none"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="address"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormTextInput
                      label={t.address}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Street, City"
                      error={errors.address?.message}
                    />
                  )}
                />

                {/* Submit CTA (gradient) */}
                <Pressable
                  onPress={handleSubmit(onSubmit)}
                  disabled={submitting}
                  style={{ borderRadius: 12, overflow: "hidden", opacity: submitting ? 0.7 : 1 }}
                >
                  <LinearGradient colors={[C.g1, C.g3]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                    <Text style={styles.ctaText}>{submitting ? "Submitting..." : t.submit}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>

            <View style={{ height: 24 }} />
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

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -60,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 70,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    marginRight: 8,
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 0.3 },
  headerSub: { color: "rgba(255,255,255,0.92)", marginTop: 8, fontWeight: "700", marginLeft: "35%" },

  scrollBody: { padding: 16, paddingBottom: 32 },

  /* Event summary card */
  eventOutline: {
    borderRadius: R + 2,
    padding: 1.5,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  eventCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: R,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.7)",
  },
  eventTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eventName: { fontWeight: "900", fontSize: 16, color: C.text, flex: 1, paddingRight: 8 },
  eventPill: {
    backgroundColor: C.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  eventPillText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  eventMetaRow: { flexDirection: "row", alignItems: "center", columnGap: 8, marginTop: 8 },
  eventMetaText: { color: C.sub, fontWeight: "700" },

  /* Form card */
  formOutline: {
    borderRadius: R + 2,
    padding: 1.5,
    marginTop: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  formCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: R,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.7)",
  },

  /* Language chips */
  langRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
  },
  langChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  langChipText: { color: C.text, fontWeight: "800", fontSize: 12 },
  langChipTextActive: { color: "#fff" },

  /* Inputs & chips */
  inputLabel: { fontWeight: "700", marginBottom: 6, color: C.text },
  genderRow: { flexDirection: "row", gap: 10 },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
  },
  genderChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  genderChipText: { color: C.text, fontWeight: "800" },
  genderChipTextActive: { color: "#fff" },
  errorText: { color: C.error, marginTop: 4 },

  /* CTA */
  cta: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.2 },
});