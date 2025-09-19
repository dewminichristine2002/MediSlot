import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api/config';

export default function AdminScanScreen() {
  const { user } = useAuth();
  const role = (user?.user_category || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'manager';

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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

  return (
    <View style={styles.container}>
      {!isAdmin ? (
        <Text style={styles.note}>{instructions}</Text>
      ) : !permission?.granted ? (
        <View style={{ padding: 20 }}>
          <Text style={styles.note}>{instructions}</Text>
          {permission?.canAskAgain !== false && (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={requestPermission}>
              <Text style={styles.btnPrimaryText}>Allow Camera</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarcode}
          />
          <View style={styles.panel}>
            {loading && (
              <View style={styles.row}>
                <ActivityIndicator />
                <Text style={{ marginLeft: 8, color: '#fff' }}>Processing…</Text>
              </View>
            )}

            {result && !loading && (
              <View style={styles.card}>
                <Text style={styles.title}>Event: {result.event_name}</Text>
                <Text style={styles.meta}>
                  Date: {new Date(result.event_date).toLocaleDateString()} {result.event_time}
                </Text>

                <Text style={styles.line}><Text style={styles.label}>Name: </Text>{result.patient_name}</Text>
                <Text style={styles.line}><Text style={styles.label}>NIC: </Text>{result.nic}</Text>
                <Text style={styles.line}><Text style={styles.label}>Gender: </Text>{result.gender}</Text>
                <Text style={styles.line}><Text style={styles.label}>Age: </Text>{result.age}</Text>
                <Text style={styles.line}><Text style={styles.label}>Telephone: </Text>{result.contact_number}</Text>
                <Text style={styles.line}><Text style={styles.label}>Email: </Text>{result.email}</Text>
                <Text style={styles.line}><Text style={styles.label}>Address: </Text>{result.address}</Text>

                <Text style={[styles.line, { marginTop: 6 }]}>
                  <Text style={styles.label}>Status: </Text>
                  {result.status}
                  {result.waitlist_position ? ` (Waitlist ${result.waitlist_position})` : ''}
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[
                      styles.btn,
                      result.status === 'attended' ? styles.btnDisabled : styles.btnPrimary,
                    ]}
                    disabled={loading || result.status === 'attended'}
                    onPress={markAttended}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnPrimaryText}>
                        {result.status === 'attended' ? 'Already Attended' : 'Mark as Attended'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, styles.btnGhost]}
                    onPress={() => setResult(null)}
                    disabled={loading}
                  >
                    <Text style={styles.btnGhostText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!result && !loading && (
              <Text style={styles.hint}>Point at a QR code to scan…</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  title: { fontSize: 16, fontWeight: '800' },
  meta: { color: '#555', marginTop: 2, marginBottom: 8 },
  line: { marginTop: 4 },
  label: { fontWeight: '700' },
  hint: { color: '#fff', textAlign: 'center' },
  note: { padding: 20, textAlign: 'center', color: '#fff' },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnPrimary: { backgroundColor: '#2563EB' },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
  btnDisabled: { backgroundColor: '#9CA3AF' },
  btnGhost: { backgroundColor: '#F3F4F6' },
  btnGhostText: { color: '#111827', fontWeight: '700' },
});
