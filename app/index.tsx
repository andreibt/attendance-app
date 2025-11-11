import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Redirect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, UserRole } from '@/context/AuthContext';

const roleOptions: { key: UserRole; title: string; description: string }[] = [
  {
    key: 'teacher',
    title: 'Teacher',
    description: 'Create classes, approve enrollments, and track attendance insights.',
  },
  {
    key: 'student',
    title: 'Student',
    description: 'Join classes, request enrollment, and confirm attendance in real time.',
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Redirect href={user.role === 'teacher' ? '/(tabs)/index' : '/(tabs)/explore'} />;
  }

  const handleSubmit = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Enter your name to continue.');
      return;
    }

    login(trimmedName, selectedRole);
    setError(null);

    const destination = selectedRole === 'teacher' ? '/(tabs)/index' : '/(tabs)/explore';
    router.replace(destination);
  };

  return (
    <ThemedView style={styles.container} lightColor="#f9fafb" darkColor="#0b1120">
      <ThemedView style={styles.card} lightColor="#ffffff" darkColor="#1f2933">
        <ThemedText type="title" style={styles.title}>
          Welcome back
        </ThemedText>
        <ThemedText style={styles.subtitle} lightColor="#6b7280" darkColor="#9ca3af">
          Sign in to access your attendance tools.
        </ThemedText>

        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold">Display name</ThemedText>
          <TextInput
            placeholder="Enter your name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError(null);
            }}
            style={styles.input}
            autoCapitalize="words"
          />
          {error ? (
            <ThemedText style={styles.errorText} lightColor="#b91c1c" darkColor="#fca5a5">
              {error}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold">Role</ThemedText>
          <View style={styles.roleGroup}>
            {roleOptions.map((option) => {
              const isActive = option.key === selectedRole;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setSelectedRole(option.key)}
                  style={({ pressed }) => [
                    styles.roleCard,
                    isActive && styles.roleCardActive,
                    pressed && styles.roleCardPressed,
                  ]}
                >
                  <ThemedText type="subtitle" style={styles.roleTitle}>
                    {option.title}
                  </ThemedText>
                  <ThemedText style={styles.roleDescription} lightColor="#6b7280" darkColor="#9ca3af">
                    {option.description}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable onPress={handleSubmit} style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}>
          <ThemedText style={styles.submitButtonText}>Continue</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    gap: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  fieldGroup: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 14,
  },
  roleGroup: {
    gap: 12,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  roleCardActive: {
    borderColor: '#0a7ea4',
    backgroundColor: '#e0f2fe',
  },
  roleCardPressed: {
    opacity: 0.7,
  },
  roleTitle: {
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonPressed: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
