// MediSlotApp/src/screens/NewBookingScreen.js
import React, { useEffect, useMemo, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  Alert,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import PrimaryButton from "../components/PrimaryButton";
import {
  listCentersApi,
  listTestsForCenterApi,
  listSlotsForTestApi,
} from "../api/browse";
import { createBookingApi } from "../api/bookings";
import { useAuth } from "../context/AuthContext";

// ---- helpers
function nextDays(n = 14) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    out.push({ key: `${yyyy}-${mm}-${dd}` });
  }
  return out;
}

function normalizeTest(raw) {
  if (!raw) return null;
  const centerTestId =
    raw.centerTestId ||
    raw.center_test_id ||
    (raw.centerTest && (raw.centerTest._id || raw.centerTest.id)) ||
    (typeof raw.centerTest === "string" && raw.centerTest) ||
    (typeof raw._id === "string" && raw._id) ||
    (raw._id && raw._id.$oid);

  const testId =
    raw.testId ||
    raw.test_id ||
    (raw.test && (raw.test._id || raw.test.id)) ||
    (typeof raw.test === "string" && raw.test);

  const name =
    raw.name ||
    (raw.test && raw.test.name) ||
    (raw.centerTest && raw.centerTest.name) ||
    raw.label ||
    "Test";

  const price = Number(
    raw.price ??
      (raw.test && raw.test.price) ??
      (raw.centerTest && raw.centerTest.price) ??
      0
  );

  const id = String(centerTestId || testId || "");
  if (!id) return null;

  return {
    id,
    centerTestId: centerTestId ? String(centerTestId) : null,
    testId: testId ? String(testId) : null,
    name,
    price,
  };
}

export default function NewBookingScreen({ navigation }) {
  const { user } = useAuth();

  const [loadingCenters, setLoadingCenters] = useState(true);
  const [centers, setCenters] = useState([]);
  const [centerId, setCenterId] = useState(null);

  const [loadingTests, setLoadingTests] = useState(false);
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState(null);

  const days = useMemo(() => nextDays(14), []);
  const [dateISO, setDateISO] = useState(days[0]?.key);
  const [hasAnyTime, setHasAnyTime] = useState(false);

  const [patientName, setPatientName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.contact_no || "");
  const [payMethod, setPayMethod] = useState("pay_at_center");
  const [submitting, setSubmitting] = useState(false);

  // hide native header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // load centers
  useEffect(() => {
    (async () => {
      try {
        setLoadingCenters(true);
        const { data } = await listCentersApi();
        const items = data?.items || data || [];
        setCenters(items);
        if (items[0]?._id) setCenterId(items[0]._id);
      } catch (e) {
        Alert.alert(
          "Error",
          e?.response?.data?.message || "Failed to load centers"
        );
      } finally {
        setLoadingCenters(false);
      }
    })();
  }, []);

  // load tests
  useEffect(() => {
    if (!centerId) {
      setTests([]);
      setSelectedTestId(null);
      return;
    }
    (async () => {
      try {
        setLoadingTests(true);
        const { data } = await listTestsForCenterApi(centerId);
        const raw = data?.items || data || [];
        const normalized = raw.map(normalizeTest).filter(Boolean);
        setTests(normalized);

        setSelectedTestId((prev) =>
          normalized.some((x) => x.id === prev)
            ? prev
            : normalized[0]?.id ?? null
        );
      } catch (e) {
        Alert.alert(
          "Error",
          e?.response?.data?.message || "Failed to load tests"
        );
      } finally {
        setLoadingTests(false);
      }
    })();
  }, [centerId]);

  // check availability
  useEffect(() => {
    (async () => {
      if (!centerId || !selectedTestId || !dateISO) {
        setHasAnyTime(false);
        return;
      }
      try {
        const { data } = await listSlotsForTestApi(
          selectedTestId,
          centerId,
          dateISO
        );
        const times = Array.isArray(data?.times) ? data.times : data || [];
        setHasAnyTime(times.length > 0);
      } catch {
        setHasAnyTime(false);
      }
    })();
  }, [centerId, selectedTestId, dateISO]);

  const onBook = async () => {
    try {
      if (!centerId)
        return Alert.alert("Error", "Please select a health center");
      if (!selectedTestId) return Alert.alert("Error", "Please select a test");
      if (!dateISO) return Alert.alert("Error", "Please pick a date");
      if (!patientName.trim())
        return Alert.alert("Error", "Patient name is required");
      if (!phone.trim()) return Alert.alert("Error", "Phone is required");

      const chosen = tests.find((x) => x.id === selectedTestId);
      if (!chosen) return Alert.alert("Error", "Please select a test");

      const backendId = chosen.centerTestId || chosen.id;
      const price = Number(chosen.price || 0);

      // Hidden/placeholder time; lab assigns exact time later
      const hiddenTime = "09:00";

      const payload = {
        healthCenter: centerId,
        scheduledDate: dateISO,
        scheduledTime: hiddenTime,
        patientName: patientName.trim(),
        contactNumber: phone.trim(),
        items: [{ centerTest: backendId, name: chosen.name, price }],
        tests: [backendId],
        payment: { method: payMethod, status: "unpaid", amount: price },
        price,
      };

      setSubmitting(true);
      const { data: booking } = await createBookingApi(payload);

      if (payMethod === "online") {
        navigation.navigate("PaymentCheckout", { bookingId: booking._id });
      } else {
        Alert.alert(
          "Booked",
          `Booking #${booking.appointment_no} created.\nThe lab will confirm your exact time.`
        );
        navigation.goBack();
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (Array.isArray(e?.response?.data?.details)
          ? e.response.data.details.join(", ")
          : null) ||
        e.message ||
        "Create failed";
      Alert.alert("Create failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const Chip = ({ on, children, onPress }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: on ? "#e8f0fe" : "#fff",
          borderColor: on ? "#2563eb" : "#ddd",
        },
      ]}
    >
      <Text style={{ fontWeight: "700" }}>{children}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Gradient header */}
      <SafeAreaView edges={["top"]}>
        <LinearGradient colors={["#2563eb", "#06b6d4"]} style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>

            <Text style={styles.headerTitle}>Book New Test</Text>
          </View>

          <Text style={styles.headerSubtitle}>Choose center, test & date</Text>
        </LinearGradient>
      </SafeAreaView>

      <View style={{ padding: 16 }}>
        {/* Centers */}
        <Text style={styles.label}>Health Center</Text>
        {loadingCenters ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.rowWrap}>
            {centers.map((c) => (
              <Chip
                key={c._id}
                on={centerId === c._id}
                onPress={() => setCenterId(c._id)}
              >
                {c.name}
              </Chip>
            ))}
            {!centers.length && (
              <Text style={{ color: "#777" }}>No centers found</Text>
            )}
          </View>
        )}

        {/* Tests */}
        <Text style={styles.label}>Test</Text>
        {loadingTests ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.rowWrap}>
            {tests.map((t) => (
              <Chip
                key={t.id}
                on={selectedTestId === t.id}
                onPress={() => setSelectedTestId(t.id)}
              >
                {t.name}
              </Chip>
            ))}
            {!tests.length && (
              <Text style={{ color: "#777" }}>No tests for this center</Text>
            )}
          </View>
        )}

        {/* Dates */}
        <Text style={styles.label}>Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
          <View style={styles.rowWrap}>
            {days.map((d) => (
              <Chip key={d.key} on={d.key === dateISO} onPress={() => setDateISO(d.key)}>
                {d.key}
              </Chip>
            ))}
          </View>
        </ScrollView>

        <Text style={{ color: hasAnyTime ? "green" : "#b45309", marginBottom: 8 }}>
          {hasAnyTime
            ? "Time available — exact time will be assigned by the lab."
            : "Lab will confirm the exact time after booking."}
        </Text>

        {/* Patient */}
        <Text style={styles.label}>Patient Name</Text>
        <TextInput
          value={patientName}
          onChangeText={setPatientName}
          placeholder="Patient name"
          style={styles.input}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="07xxxxxxxx"
          keyboardType="phone-pad"
          style={styles.input}
        />

        {/* Payment */}
        <Text style={styles.label}>Payment</Text>
        <View style={styles.rowWrap}>
          <Chip
            on={payMethod === "pay_at_center"}
            onPress={() => setPayMethod("pay_at_center")}
          >
            Pay at center
          </Chip>
          <Chip on={payMethod === "online"} onPress={() => setPayMethod("online")}>
            Pay now (online)
          </Chip>
        </View>

        {/* Book button styled with header blue */}
        <PrimaryButton
          title={submitting ? "Booking…" : "Book"}
          onPress={onBook}
          disabled={
            submitting ||
            !centerId ||
            !selectedTestId ||
            !dateISO ||
            !patientName.trim() ||
            !phone.trim()
          }
          style={{ marginTop: 16, backgroundColor: "#2563eb" }}
          textStyle={{ color: "#fff", fontWeight: "700" }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60, // tighter to the top; adjust to 0 if you want it flush
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop:-60,
   
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    flexShrink: 1,
  },
  headerSubtitle: { fontSize: 14, color: "#e0f2fe" },
  label: { fontWeight: "700", marginTop: 12, marginBottom: 6 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
});
