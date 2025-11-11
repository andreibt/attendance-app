import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

export default function TabsIndexRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/" />;
  }

  return <Redirect href={user.role === 'teacher' ? '/(tabs)/teacher' : '/(tabs)/student'} />;
}
