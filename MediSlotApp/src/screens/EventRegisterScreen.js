// src/screens/EventRegisterScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Alert, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getApiBaseUrl } from "../api/config";
import { useAuth } from "../context/AuthContext";
import FormTextInput from "../components/FormTextInput";
import PrimaryButton from "../components/PrimaryButton";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  nic: z.string().min(5, "NIC required"),
  gender: z.enum(["Male", "Female"]).optional(),
  age: z.coerce.number().int().min(0).max(120, "Invalid age"),
  contact: z.string().min(7, "Contact required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export default function EventRegisterScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const event = route.params?.event;

  // Your AuthContext (as pasted) only exposes { user, loading, signIn, signOut }
  const { user, loading: authLoading } = useAuth();

  // Load token directly from AsyncStorage so we can call the API
  const [token, setToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem("token");
        setToken(t);
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
            patient_id: user?._id || null, // optional: send user id too
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Registration failed");
      }

      const msg =
        data.status === "waitlist"
          ? `You are added to the waitlist.\nPosition: ${data.waitlist_position ?? "TBD"}`
          : "Registration confirmed!";

      Alert.alert("Success", msg, [
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

  // While restoring session or token, avoid showing "not logged in"
  if (authLoading || tokenLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Preparing…</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ fontSize: 16, textAlign: "center" }}>
          You’re not logged in. Please login again to register for events.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register for Event</Text>

      {event && (
        <View style={styles.eventBox}>
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.eventMeta}>
            {new Date(event.date).toLocaleDateString()} at {event.time}
          </Text>
          <Text style={styles.eventMeta}>{event.location}</Text>
        </View>
      )}

      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <FormTextInput
            label="Full Name*"
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
            label="NIC*"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="123456789V"
            error={errors.nic?.message}
          />
        )}
      />

      {/* Gender dropdown */}
      <Controller
        control={control}
        name="gender"
        render={({ field: { value, onChange } }) => (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Gender</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <Picker
                selectedValue={value ?? ""}
                onValueChange={(v) => onChange(v === "" ? undefined : v)}
              >
                <Picker.Item label="Select gender" value="" />
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
              </Picker>
            </View>
            {!!errors.gender?.message && (
              <Text style={{ color: "red", marginTop: 4 }}>
                {errors.gender.message}
              </Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="age"
        render={({ field: { value, onChange, onBlur } }) => (
          <FormTextInput
            label="Age*"
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
        render={({ field: { value, onChange, onBlur } }) => (
          <FormTextInput
            label="Contact Number*"
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
            label="Email"
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
            label="Address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Street, City"
            error={errors.address?.message}
          />
        )}
      />

      <PrimaryButton
        title={submitting ? "Submitting..." : "Submit"}
        onPress={handleSubmit(onSubmit)}
        disabled={submitting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 12 },
  eventBox: {
    backgroundColor: "#F4F6FF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  eventName: { fontWeight: "800", fontSize: 16, marginBottom: 4 },
  eventMeta: { color: "#333" },
});
