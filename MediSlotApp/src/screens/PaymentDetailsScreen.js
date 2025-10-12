import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

export default function PaymentDetailsScreen({ route, navigation }) {
  const checkoutUrl = route?.params?.checkoutUrl;
  const bookingId   = route?.params?.bookingId;

  const onNavChange = (nav) => {
    if (!nav?.url) return;
    // Success path: your backend returns this URL after successful payment
    if (nav.url.includes("/api/payments/checkout-return")) {
      navigation.replace("BookingSuccess", { bookingId });
    }
    // Optional: handle cancel
    if (nav.url.includes("/api/payments/checkout-cancel")) {
      navigation.goBack();
    }
  };

  if (!checkoutUrl) {
    return (
      <View style={{flex:1, alignItems:"center", justifyContent:"center"}}>
        <Text>No checkout URL</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16, paddingHorizontal:16, paddingVertical:10, borderRadius:8, backgroundColor:"#1976d2" }}
        >
          <Text style={{ color:"#fff", fontWeight:"600" }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:"#fff" }}>
      {/* Simple header */}
      <View style={{ paddingTop: 54, paddingBottom: 12, paddingHorizontal:16, backgroundColor:"#0ea5e9" }}>
        <Text style={{ color:"#fff", fontSize:18, fontWeight:"700" }}>Add Card Details</Text>
        <Text style={{ color:"#e0f2fe", marginTop:4 }}>Secure payment via Stripe</Text>
      </View>

      <WebView
        source={{ uri: checkoutUrl }}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop:8 }}>Loading payment…</Text>
          </View>
        )}
        onNavigationStateChange={onNavChange}
      />
    </View>
  );
}
