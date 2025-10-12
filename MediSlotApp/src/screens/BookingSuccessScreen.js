import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Share,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getApiBaseUrl } from "../utils/getApiBaseUrl";

const BASE_URL = getApiBaseUrl();
console.log("🟢 Base URL →", BASE_URL);

export default function BookingSuccessScreen({ route, navigation }) {
  const bookingId = route?.params?.bookingId;

  const onDownloadReceipt = () => {
    if (!BASE_URL) {
      alert("Base URL missing");
      return;
    }
    const url = `${BASE_URL}/api/bookings/${bookingId}/receipt`;
    console.log("Opening receipt:", url);
    Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={["#0ea5e9", "#0284c7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          alignItems: "center",
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          elevation: 5,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
          Booking Confirmed 🎉
        </Text>
      </LinearGradient>

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
          padding: 24,
        }}
      >
        {/* Success Section */}
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: "#dcfce7",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#16a34a",
              shadowOpacity: 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Ionicons name="checkmark" size={64} color="#16a34a" />
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: "#111827",
              marginTop: 24,
              textAlign: "center",
            }}
          >
            Success!
          </Text>

          <Text
            style={{
              color: "#475569",
              textAlign: "center",
              marginTop: 8,
              lineHeight: 22,
              fontSize: 15,
            }}
          >
            Your appointment has been successfully booked.
            {bookingId ? `\nReference ID: ${bookingId}` : ""}
          </Text>
        </View>

        {/* Buttons Section */}
        <View style={{ width: "100%", marginBottom: 30 }}>
          <TouchableOpacity
            onPress={onDownloadReceipt}
            style={{
              width: "100%",
              backgroundColor: "#0284c7",
              paddingVertical: 15,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 14,
              shadowColor: "#0284c7",
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="download-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                Download Receipt
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("HomeTab", {
                screen: "Home",
              })
            }
            style={{
              width: "100%",
              backgroundColor: "#fff",
              paddingVertical: 15,
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1.2,
              borderColor: "#dbeafe",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="home-outline"
                size={20}
                color="#0ea5e9"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  color: "#0ea5e9",
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                Go to Home
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
