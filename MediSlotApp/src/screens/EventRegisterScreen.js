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
import { SafeAreaView } from "react-native-safe-area-context"; // ← new import
import { useRoute, useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getApiBaseUrl } from "../api/config";
import { useAuth } from "../context/AuthContext";
import FormTextInput from "../components/FormTextInput";
import PrimaryButton from "../components/PrimaryButton";
import AsyncStorage from "@react-native-async-storage/async-storage";

const C = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  text: "#0F172A",
  sub: "#64748B",
  border: "#E6EAF2",
  primary: "#2563EB",
};

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  nic: z.string().min(5, "NIC required"),
  gender: z.enum(["Male", "Female"]).optional(),
  age: z.coerce.number().int().min(0).max(120, "Invalid age"),
  contact: z.string().min(7, "Contact required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

// --- Minimal i18n ---
const STRINGS = {
  en: {
    title: "Register for Event",
    eventDateAt: (d, t) => `${new Date(d).toLocaleDateString()} at ${t || "-"}`,
    notLoggedIn:
      "You’re not logged in. Please login again to register for events.",
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
    eventDateAt: (d, t) =>
      `${new Date(d).toLocaleDateString()} • ${t || "-"}`,
    notLoggedIn:
      "ඔබ පිවිසුන තත්ත්වයේ නොමැත. සිදුවීම් සඳහා ලියාපදිංචි වීමට කරුණාකර නැවත පිවිසෙන්න.",
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
    eventDateAt: (d, t) =>
      `${new Date(d).toLocaleDateString()} • ${t || "-"}`,
    notLoggedIn:
      "நீங்கள் உள்நுழையவில்லை. நிகழ்வுகளுக்கு பதிவு செய்ய மீண்டும் உள்நுழையவும்.",
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
  const l =
    (Intl?.DateTimeFormat?.().resolvedOptions?.().locale || "en").toLowerCase();
  if (l.startsWith("si")) return "si";
  if (l.startsWith("ta")) return "ta";
  return "en";
}

// Chip-style gender selector
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
              <Text
                style={[styles.genderChipText, active && styles.genderChipTextActive]}
              >
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
        waitlist_position:
          reg?.waitlist_position ?? data?.waitlist_position ?? null,
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
        <Text style={{ marginTop: 10, color: C.sub }}>Preparing…</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={[styles.center, { padding: 24 }]}>
        <Text style={{ fontSize: 16, textAlign: "center", color: C.text }}>
          {STRINGS[lang].notLoggedIn}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "right", "left"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={[styles.container, { flexGrow: 1 }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.title}>{STRINGS[lang].title}</Text>
              <View style={styles.langChips}>
                {[
                  { k: "en", label: "EN" },
                  { k: "si", label: "සිං" },
                  { k: "ta", label: "தமிழ்" },
                ].map((o) => (
                  <Pressable
                    key={o.k}
                    onPress={() => setLang(o.k)}
                    style={[styles.chip, lang === o.k && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        lang === o.k && styles.chipTextActive,
                      ]}
                    >
                      {o.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Event summary */}
            {event && (
              <View style={styles.eventBox}>
                <View style={styles.eventAccent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventMeta}>
                    {STRINGS[lang].eventDateAt(event.date, event.time)}
                  </Text>
                  {!!event.location && (
                    <Text style={styles.eventMeta}>{event.location}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Form fields */}
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormTextInput
                  label={STRINGS[lang].fullName}
                  value={value}
                  onChangeText={onChange}
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
                  label={STRINGS[lang].nic}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="123456789V"
                  error={errors.nic?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="gender"
              render={({ field: { value, onChange } }) => (
                <GenderChips
                  t={STRINGS[lang]}
                  value={value}
                  onChange={onChange}
                  error={errors.gender?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="age"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormTextInput
                  label={STRINGS[lang].age}
                  value={String(value ?? "")}
                  onChangeText={onChange}
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
              render={({ field: { value, onChange, onBlur} }) => (
                <FormTextInput
                  label={STRINGS[lang].contact}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  placeholder="+94 7X XXX XXXX"
                  error={errors.contact?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormTextInput
                  label={STRINGS[lang].email}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  placeholder="name@example.com"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormTextInput
                  label={STRINGS[lang].address}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Street, City"
                  error={errors.address?.message}
                />
              )}
            />

            <PrimaryButton
              title={submitting ? "Submitting..." : STRINGS[lang].submit}
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
            />

            <View style={{ height: 24 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  title: { fontSize: 22, fontWeight: "900", color: C.text, flex: 1 },
  langChips: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.text, fontWeight: "800", fontSize: 12 },
  chipTextActive: { color: "#fff" },

  eventBox: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
    overflow: "hidden",
  },
  eventAccent: { width: 6, backgroundColor: C.primary },
  eventName: {
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
    color: C.text,
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  eventMeta: { color: C.sub, paddingHorizontal: 12, paddingBottom: 6 },

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

  errorText: { color: "#E11D48", marginTop: 4 },
});
