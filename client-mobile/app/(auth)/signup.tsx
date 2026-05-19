import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { API_BASE_URL } from '../../src/config/api';

export default function SignupScreen() {
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.username) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Registration failed');

      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'OK', onPress: () => router.push('/(auth)/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Signup Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.brandRow}>
          <Text style={styles.logo}>
            <Text style={styles.logoAccent}>Buy</Text>Force
          </Text>
        </View>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join us and start saving with groups</Text>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              placeholder="your_username"
              placeholderTextColor="#adb5bd"
              style={styles.input}
              autoCapitalize="none"
              onChangeText={(t) => setForm({ ...form, username: t })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor="#adb5bd"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(t) => setForm({ ...form, email: t })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#adb5bd"
              style={styles.input}
              secureTextEntry
              onChangeText={(t) => setForm({ ...form, password: t })}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.link}>
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkAccent}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 28, justifyContent: 'center' },
  brandRow: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  logoAccent: { color: '#228be6' },
  title: { fontSize: 26, fontWeight: '800', color: '#111', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#868e96', marginBottom: 28 },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#495057' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    color: '#111',
  },
  button: {
    backgroundColor: '#228be6',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { alignItems: 'center', marginTop: 8 },
  linkText: { fontSize: 14, color: '#868e96' },
  linkAccent: { color: '#228be6', fontWeight: '700' },
});
