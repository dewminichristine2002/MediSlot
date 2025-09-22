// src/screens/AdminScanScreen.js
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/config';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const C = {
  bg: '#0B1221',
  surface: '#0F172A',
  card: '#FFFFFF',
  text: '#0F172A',
  sub: '#475569',
  border: '#E5E7EB',
  g1: '#2563EB', // blue
  g2: '#06B6D4', // cyan
  g3: '#10B981', // emerald
  primary: '#2563EB',
  success: '#10B981',
  danger: '#EF4444',
};

function shadow(elev = 6) {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elev / 2 },
      shadowOpacity: 0.18,
      shadowRadius: elev,
    },
    android: { elevation: elev },
    default: {},
  });
}

export default function AdminScanScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const role = (user?.user_category || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'manager';

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // animated scanning line
  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanAnim]);

  // ask permission on mount if possible
  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain !== false) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const instructions = useMemo(() => {
    if (!isAdmin) return 'Only admins can access the scanner.';
    if (!permission) return 'Checking camera permission…';
    if (!permission.granted) return 'Camera permission not granted.';
    return '';
  }, [isAdmin, permission]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else if (navigation.getState()?.routeNames?.includes('Home')) navigation.navigate('Home');
  }, [navigation]);

  const extractRegistrationId = useCallback((qrRaw) => {
    if (!qrRaw) return null;

    try {
      if (typeof qrRaw === 'string' && /^https?:\/\//i.test(qrRaw)) {
        const u = new URL(qrRaw);
        const rid = u.searchParams.get('rid');
        if (rid) return rid;
      }
    } catch {}

    try {
      const parsed = JSON.parse(qrRaw);
      if (parsed?.registration_id) return parsed.registration_id;
      if (parsed?.regId) return parsed.regId;
      if (typeof parsed === 'string') return parsed;
    } catch {}

    if (typeof qrRaw === 'string') {
      const s = qrRaw.trim();
      if (/^[a-f0-9]{24}$/i.test(s)) return s;
      return s;
    }
    return null;
  }, []);

  const handleBarcode = useCallback(
    async ({ data }) => {
      if (scanned || !isAdmin || !permission?.granted) return;
      setScanned(true);
      setLoading(true);
      setResult(null);

      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        let body = { qr_text: data };
        const maybeRid = extractRegistrationId(data);
        if (maybeRid) body = { registration_id: maybeRid };

        const res = await fetch(`${getApiBaseUrl()}/api/event-registrations/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Scan failed (${res.status})`);
        const json = await res.json();
        setResult(json);
      } catch (e) {
        Alert.alert('Scan error', e?.message || 'Could not read this code.');
      } finally {
        setLoading(false);
        setTimeout(() => setScanned(false), 1200);
      }
    },
    [extractRegistrationId, isAdmin, permission?.granted, scanned]
  );

  const markAttended = useCallback(async () => {
    if (!result?.registration_id) return;
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${getApiBaseUrl()}/api/event-registrations/${encodeURIComponent(result.registration_id)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'attended' }),
        }
      );
      if (!res.ok) {
        let msg = `Update failed (${res.status})`;
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const updated = await res.json();
      setResult((r) => ({ ...r, status: updated?.status || 'attended' }));
      Alert.alert('Success', 'Marked as attended.');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not update status.');
    } finally {
      setLoading(false);
    }
  }, [result?.registration_id]);

  // UI helpers
  const StatusPill = ({ status }) => {
    const s = String(status || '').toLowerCase();
    const conf = s === 'attended'
      ? { bg: 'rgba(16,185,129,0.12)', text: C.success, label: 'ATTENDED' }
      : s === 'waitlist' || s === 'waiting'
        ? { bg: 'rgba(37,99,235,0.12)', text: C.primary, label: 'WAITLIST' }
        : { bg: 'rgba(2,132,199,0.12)', text: '#0EA5A6', label: (status || 'STATUS').toUpperCase() };
    return (
      <View style={[styles.pill, { backgroundColor: conf.bg, borderColor: 'rgba(148,163,184,0.25)' }]}>
        <Text style={[styles.pillText, { color: conf.text }]}>{conf.label}</Text>
      </View>
    );
  };

  const Header = () => (
    <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
      <Pressable onPress={handleBack} hitSlop={10} style={styles.headerBack}>
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </Pressable>
      <Text style={styles.headerTitle}>Admin QR Scanner</Text>
      <Text style={styles.headerSub}>Scan attendee registrations at events</Text>
    </LinearGradient>
  );

  // Different states
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header />
        <View style={styles.centerBox}>
          <Ionicons name="shield-outline" size={48} color="#fff" />
          <Text style={styles.centerTitle}>Access Restricted</Text>
          <Text style={styles.centerSub}>{instructions}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header />
        <View style={styles.centerBox}>
          <Ionicons name="camera-outline" size={52} color="#fff" />
          <Text style={styles.centerTitle}>Camera Permission</Text>
          <Text style={styles.centerSub}>{instructions}</Text>

          {permission?.canAskAgain !== false && (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={requestPermission}>
              <LinearGradient colors={[C.g1, C.g2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnFill}>
                <Text style={styles.btnPrimaryText}>Allow Camera</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Main UI
  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 170], // vertical travel inside frame
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Header />

      <View style={styles.cameraWrap}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcode}
        />

        {/* dark overlay */}
        <View pointerEvents="none" style={styles.overlay}>
          {/* cutout frame */}
          <View style={styles.frameOuter}>
            <View style={styles.frameInner}>
              {/* animated scan line */}
              <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
              {/* corner accents */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>

          <Text style={styles.scanHint}>Align the QR code within the frame</Text>
        </View>

        {/* bottom panel */}
        <View style={styles.panel}>
          {loading && (
            <View style={[styles.row, { marginBottom: 10 }]}>
              <ActivityIndicator color="#fff" />
              <Text style={{ marginLeft: 8, color: '#fff', fontWeight: '700' }}>Processing…</Text>
            </View>
          )}

          {result && !loading ? (
            <View style={[styles.card, shadow(8)]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {result.event_name || 'Event'}
                </Text>
                <StatusPill status={result.status} />
              </View>

              <Text style={styles.meta}>
                {result.event_date ? new Date(result.event_date).toLocaleDateString() : '-'}
                {result.event_time ? `  •  ${result.event_time}` : ''}
              </Text>

              <View style={styles.grid}>
                <InfoRow label="Name" value={result.patient_name} />
                <InfoRow label="NIC" value={result.nic} />
                <InfoRow label="Gender" value={result.gender} />
                <InfoRow label="Age" value={result.age} />
                <InfoRow label="Telephone" value={result.contact_number} />
                <InfoRow label="Email" value={result.email} />
                <InfoRow label="Address" value={result.address} />
                {result.waitlist_position != null && (
                  <InfoRow label="Waitlist" value={`#${result.waitlist_position}`} />
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, result.status === 'attended' ? styles.btnDisabled : styles.btnPrimary]}
                  disabled={loading || result.status === 'attended'}
                  onPress={markAttended}
                >
                  <LinearGradient
                    colors={result.status === 'attended' ? ['#9CA3AF', '#9CA3AF'] : [C.g1, C.g2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.btnFill}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnPrimaryText}>
                        {result.status === 'attended' ? 'Already Attended' : 'Mark as Attended'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setResult(null)} disabled={loading}>
                  <Text style={styles.btnGhostText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : !loading ? (
            <Text style={styles.hint}>Point at a QR code to scan…</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoKey}>{label}</Text>
      <Text style={styles.infoVal} numberOfLines={1}>
        {String(value)}
      </Text>
    </View>
  );
}

const FRAME_SIZE = 220;
const CORNER = 20;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -60,
    ...shadow(6),
  },
  headerBack: {
    position: 'absolute',
    left: 12,
    top: 40,
    zIndex: 10,
    marginTop: 55
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 68,marginLeft: '35' },
  headerSub: { color: 'rgba(255,255,255,0.92)', marginTop: 6, fontWeight: '700',marginLeft: '35' },

  cameraWrap: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  /* Overlay */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameOuter: {
    width: FRAME_SIZE + 36,
    height: FRAME_SIZE + 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameInner: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#fff',
  },
  cornerTL: { top: -1, left: -1, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },

  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#22d3ee',
    opacity: 0.85,
  },
  scanHint: {
    marginTop: 16,
    color: '#E2E8F0',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowRadius: 6,
  },

  /* Bottom panel */
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: 'rgba(3,7,18,0.5)',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  hint: { color: '#fff', textAlign: 'center', fontWeight: '700' },

  /* Card */
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '900', color: C.text, paddingRight: 8 },
  meta: { color: C.sub, marginTop: 4, marginBottom: 8 },

  grid: { marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  infoKey: { width: 100, color: C.sub, fontWeight: '700' },
  infoVal: { flex: 1, color: C.text, fontWeight: '700' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },

  /* Buttons */
  btn: {
    borderRadius: 12,
    overflow: 'hidden',
    ...shadow(2),
  },
  btnFill: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  btnPrimary: {},
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
  btnDisabled: {},
  btnGhost: { backgroundColor: '#F3F4F6', paddingVertical: 12, paddingHorizontal: 16 },
  btnGhostText: { color: '#111827', fontWeight: '800' },

  /* Centers */
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  centerTitle: { marginTop: 10, fontSize: 18, color: '#fff', fontWeight: '900' },
  centerSub: { color: 'rgba(255,255,255,0.92)', textAlign: 'center', marginTop: 6 },
});
