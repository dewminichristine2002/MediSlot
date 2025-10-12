import React, {
  useEffect,
  useMemo,
  useState,
  useLayoutEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Platform,
  UIManager,
  LayoutAnimation,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRoute } from "@react-navigation/native";

import PrimaryButton from "../components/PrimaryButton";
import {
  listCentersApi,
  listTestsForCenterApi,
  listSlotsForTestApi,
} from "../api/browse";
import { createBookingApi } from "../api/bookings";
import { createCheckoutSessionApi } from "../api/payments";
import { useAuth } from "../context/AuthContext";

/* ---------- Enable LayoutAnimation safely ---------- */
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  try {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  } catch {
    // ignored on new architecture
  }
}

/* ---------- helpers ---------- */
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

/* ---------- small animation helpers ---------- */
function useBouncePress() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 5,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  return { scale, onPressIn, onPressOut };
}

function usePulseOnChange(value) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.03,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }),
    ]).start();
  }, [value]);
  return scale;
}

/* ---------- Main Component ---------- */
export default function NewBookingScreen({ navigation }) {
  const { user } = useAuth();
  const route = useRoute();
  const { centerId: initialCenterId, testId: initialTestId } =
    route.params || {};

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

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  /* fade-in for card */
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslate, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const centerPulse = usePulseOnChange(centerId);
  const testPulse = usePulseOnChange(selectedTestId);

  /* ---------- Load Centers ---------- */
  useEffect(() => {
    (async () => {
      try {
        setLoadingCenters(true);
        const { data } = await listCentersApi();
        const items = data?.items || data || [];
        setCenters(items);
        if (initialCenterId && items.some((c) => c._id === initialCenterId)) {
          setCenterId(initialCenterId);
        } else if (items[0]?._id) {
          setCenterId(items[0]._id);
        }
      } catch {
        Alert.alert("Error", "Failed to load centers");
      } finally {
        setLoadingCenters(false);
      }
    })();
  }, [initialCenterId]);

  /* ---------- Load Tests ---------- */
  useEffect(() => {
    if (!centerId) {
      setTests([]);
      setSelectedTestId(null);
      return;
    }
    (async () => {
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLoadingTests(true);
        const { data } = await listTestsForCenterApi(centerId);
        const raw = data?.items || data || [];
        const normalized = raw.map(normalizeTest).filter(Boolean);
        setTests(normalized);
        if (initialTestId && normalized.some((x) => x.id === initialTestId)) {
          setSelectedTestId(initialTestId);
        } else {
          setSelectedTestId(normalized[0]?.id ?? null);
        }
      } catch {
        Alert.alert("Error", "Failed to load tests");
      } finally {
        setLoadingTests(false);
      }
    })();
  }, [centerId, initialTestId]);

  /* ---------- Check Availability ---------- */
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

  /* ---------- Book Test ---------- */
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

      const payload = {
        healthCenter: centerId,
        scheduledDate: dateISO,
        scheduledTime: "09:00",
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
        const { data } = await createCheckoutSessionApi(booking._id);
        if (data?.url) {
          navigation.navigate("PaymentDetails", {
            checkoutUrl: data.url,
            bookingId: booking._id,
          });
        } else Alert.alert("Payment", "Could not start checkout. Try again.");
      } else {
        navigation.replace("BookingSuccess", { bookingId: booking._id });
      }
    } catch (e) {
      Alert.alert("Create failed", e.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Animated Chip ---------- */
  const Chip = ({ on, children, onPress }) => {
    const { scale, onPressIn, onPressOut } = useBouncePress();
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
          style={[
            styles.chip,
            {
              backgroundColor: on ? "#e8f0fe" : "#fff",
              borderColor: on ? "#2563eb" : "#ddd",
            },
          ]}
        >
          <Text style={{ fontWeight: "700", color: on ? "#1e40af" : "#111" }}>
            {children}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  /* ---------- UI ---------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      {/* 🔹 Sticky Header */}
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: "#2563eb", zIndex: 10 }}
      >
        <LinearGradient
          colors={["#2563eb", "#06b6d4"]}
          style={styles.headerSticky}
        >
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              android_ripple={{
                color: "rgba(255,255,255,0.2)",
                borderless: false,
              }}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Book New Test</Text>
          </View>
          <Text style={styles.headerSubtitle}>Choose center, test & date</Text>
        </LinearGradient>
      </SafeAreaView>

      {/* 🔹 Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 50, paddingTop: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslate }],
            },
          ]}
        >
          <Text style={styles.label}>Health Center</Text>
          {loadingCenters ? (
            <ActivityIndicator />
          ) : (
            <Animated.View
              style={[
                styles.pickerContainer,
                { transform: [{ scale: centerPulse }] },
              ]}
            >
              <Picker
                selectedValue={centerId}
                onValueChange={(v) => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut
                  );
                  setCenterId(v);
                }}
                dropdownIconColor="#2563eb"
              >
                {centers.map((c) => (
                  <Picker.Item label={c.name} value={c._id} key={c._id} />
                ))}
              </Picker>
            </Animated.View>
          )}

          <Text style={styles.label}>Test</Text>
          {loadingTests ? (
            <ActivityIndicator />
          ) : (
            <Animated.View
              style={[
                styles.pickerContainer,
                { transform: [{ scale: testPulse }] },
              ]}
            >
              <Picker
                selectedValue={selectedTestId}
                onValueChange={(v) => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut
                  );
                  setSelectedTestId(v);
                }}
                dropdownIconColor="#2563eb"
              >
                {tests.map((t) => (
                  <Picker.Item
                    label={`${t.name} — Rs.${t.price}`}
                    value={t.id}
                    key={t.id}
                  />
                ))}
              </Picker>
            </Animated.View>
          )}

          <Text style={styles.label}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.rowWrap}>
              {days.map((d) => (
                <Chip
                  key={d.key}
                  on={d.key === dateISO}
                  onPress={() => setDateISO(d.key)}
                >
                  {d.key}
                </Chip>
              ))}
            </View>
          </ScrollView>

          <Text
            style={{
              color: hasAnyTime ? "green" : "#b45309",
              marginBottom: 8,
              fontStyle: "italic",
            }}
          >
            {hasAnyTime
              ? "Time available — lab will assign slot."
              : "Lab will confirm time after booking."}
          </Text>

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

          <Text style={styles.label}>Payment</Text>
          <View style={styles.rowWrap}>
            <Chip
              on={payMethod === "pay_at_center"}
              onPress={() => setPayMethod("pay_at_center")}
            >
              Pay at center
            </Chip>
            <Chip
              on={payMethod === "online"}
              onPress={() => setPayMethod("online")}
            >
              Pay online
            </Chip>
          </View>

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
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  headerSticky: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "#e0f2fe" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
    color: "#111827",
  },
  rowWrap: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
    overflow: "hidden",
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
