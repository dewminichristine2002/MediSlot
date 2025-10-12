import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { createCheckoutSessionApi } from "../api/payments";

// Your backend will redirect to these (set in paymentsController success_url / cancel_url)
const SUCCESS_PATH = "/api/payments/checkout-return";
const CANCEL_PATH  = "/api/payments/checkout-cancel";

export default function PaymentCheckoutScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [url, setUrl] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        if (!bookingId) {
          Alert.alert("Payment", "Missing booking id");
          navigation.goBack();
          return;
        }
        const { data } = await createCheckoutSessionApi(bookingId);
        if (data?.url) setUrl(data.url);
        else {
          Alert.alert("Payment", "Could not start checkout.");
          navigation.goBack();
        }
      } catch (e) {
        console.log("checkout session error:", e?.response?.data || e.message);
        Alert.alert("Payment", "Failed to start checkout.");
        navigation.goBack();
      }
    })();
  }, [bookingId]);

  if (!url) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: url }}
      startInLoadingState
      onNavigationStateChange={(nav) => {
        try {
          const u = new URL(nav.url);
          // Detect success/cancel URLs coming back from your server
          if (u.pathname.startsWith(SUCCESS_PATH)) {
            Alert.alert("Payment", "Payment complete. Thanks!", [
              { text: "OK", onPress: () => navigation.popToTop() },
            ]);
          }
          if (u.pathname.startsWith(CANCEL_PATH)) {
            Alert.alert("Payment", "Payment canceled.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          }
        } catch {}
      }}
    />
  );
}
