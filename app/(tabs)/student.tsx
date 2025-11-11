import { useMemo } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Redirect, useRouter } from 'expo-router';

import {
  AttendanceStatus,
  ClassRecord,
  formatDateTime,
  getSessionStatus,
  useAttendance,
} from '@/context/AttendanceContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';

const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  pending: 'Pending',
  present: 'Present',
  absent: 'Absent',
};

const makeStudentId = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');

const StudentClassCard = ({
  classItem,
  studentId,
  studentName,
  onRequestEnrollment,
  onAttend,
}: {
  classItem: ClassRecord;
  studentId: string | null;
  studentName: string;
  onRequestEnrollment: (classId: string) => void;
  onAttend: (classId: string) => void;
}) => {
  const normalizedStudentName = studentName.trim();
  const enrollment = studentId
    ? classItem.enrollments.find((item) => item.studentId === studentId)
    : undefined;
  const sessions = [...classItem.sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const activeSession = sessions.find((session) => getSessionStatus(session) === 'in-progress');
  const upcomingSession = sessions.find((session) => getSessionStatus(session) !== 'completed');
  const attendanceHistory = studentId
    ? sessions
        .map((session) => ({
          id: session.id,
          startTime: session.startTime,
          status: session.attendance[studentId],
        }))
        .filter((entry) => entry.status)
    : [];

  const activeAttendanceStatus = studentId && activeSession ? activeSession.attendance[studentId] : undefined;

  const canAttend = Boolean(
    studentId &&
      enrollment?.status === 'confirmed' &&
      activeSession &&
      typeof activeAttendanceStatus === 'string' &&
      activeAttendanceStatus !== 'present'
  );

  return (
    <ThemedView style={styles.card} lightColor="#ffffff" darkColor="#111827">
      <ThemedText type="subtitle" style={styles.cardTitle}>
        {classItem.title}
      </ThemedText>
      <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
        Instructor: {classItem.teacher}
      </ThemedText>
      {classItem.description ? (
        <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
          {classItem.description}
        </ThemedText>
      ) : null}

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>Confirmed students</ThemedText>
          <ThemedText style={styles.badgeNumber}>
            {classItem.enrollments.filter((enrollment) => enrollment.status === 'confirmed').length}
          </ThemedText>
        </View>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>Pending approvals</ThemedText>
          <ThemedText style={styles.badgeNumber}>
            {classItem.enrollments.filter((enrollment) => enrollment.status === 'pending').length}
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Enrollment</ThemedText>
        <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
          {studentId
            ? enrollment
              ? enrollment.status === 'confirmed'
                ? 'You are enrolled in this class.'
                : 'Your enrollment request is awaiting teacher approval.'
              : 'Not enrolled yet.'
            : 'Sign in to enroll and track attendance.'}
        </ThemedText>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed, !studentId && styles.disabledButton]}
          disabled={!studentId || Boolean(enrollment)}
          onPress={() => onRequestEnrollment(classItem.id)}
        >
          <ThemedText style={styles.primaryButtonText}>
            {enrollment ? (enrollment.status === 'confirmed' ? 'Enrolled' : 'Pending approval') : 'Enroll in class'}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Upcoming schedule</ThemedText>
        {upcomingSession ? (
          <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
            Next session: {formatDateTime(upcomingSession.startTime)} ({getSessionStatus(upcomingSession)})
          </ThemedText>
        ) : (
          <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
            No sessions scheduled yet.
          </ThemedText>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Attend class</ThemedText>
        <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
          Join during the scheduled time to automatically mark your attendance.
        </ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
            (!canAttend || !studentId) && styles.disabledButton,
          ]}
          disabled={!canAttend || !studentId}
          onPress={() => onAttend(classItem.id)}
        >
          <ThemedText style={styles.secondaryButtonText}>
            {activeSession
              ? canAttend
                ? 'Attend now'
                : 'Attendance recorded'
              : 'Waiting for session start'}
          </ThemedText>
        </Pressable>
      </View>

      {normalizedStudentName && attendanceHistory.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">Your attendance history</ThemedText>
          {attendanceHistory.map((entry) => (
            <View key={entry.id} style={styles.historyRow}>
              <ThemedText style={styles.historyDate}>{formatDateTime(entry.startTime)}</ThemedText>
              <ThemedText style={styles.historyStatus}>
                {AttendanceStatusLabels[entry.status as AttendanceStatus]}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </ThemedView>
  );
};

export default function StudentScreen() {
  const { classes, requestEnrollment, markAttendanceForStudent } = useAttendance();
  const { user, logout } = useAuth();
  const router = useRouter();

  const studentName = user?.name ?? '';
  const studentId = useMemo(() => {
    if (!studentName.trim()) return null;
    return makeStudentId(studentName);
  }, [studentName]);

  if (!user) {
    return <Redirect href="/" />;
  }

  if (user.role !== 'student') {
    return <Redirect href="/(tabs)/teacher" />;
  }

  const handleEnrollment = (classId: string) => {
    if (!studentId) {
      Alert.alert('Profile incomplete', 'Your profile is missing a display name.');
      Alert.alert('Profile incomplete', 'Your profile is missing a display name.');
      return;
    }

    requestEnrollment(classId, { studentId, studentName: studentName.trim() });
    Alert.alert('Request sent', 'Your enrollment request was sent to the instructor.');
  };

  const handleAttend = (classId: string) => {
    if (!studentId) {
      Alert.alert('Profile incomplete', 'Your profile is missing a display name.');
      return;
    }

    const result = markAttendanceForStudent(classId, studentId);
    if (result.success) {
      Alert.alert('Attendance confirmed', 'You have been marked present for this session.');
    } else if (result.reason) {
      Alert.alert('Unable to record attendance', result.reason);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.identityCard} lightColor="#ffffff" darkColor="#1f2933">
        <View style={styles.identityHeader}>
          <View>
            <ThemedText type="title" style={styles.title}>
              Student portal
            </ThemedText>
            <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
              Signed in as {studentName}
            </ThemedText>
          </View>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
          >
            <ThemedText style={styles.logoutButtonText}>Log out</ThemedText>
          </Pressable>
        </View>
        <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
          Request enrollment or join sessions when they are live to record your attendance.
        </ThemedText>
      </ThemedView>

      <ThemedText type="subtitle" style={styles.sectionHeading}>
        Available classes
      </ThemedText>
      {classes.length === 0 ? (
        <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
          Classes will appear here once created by instructors.
        </ThemedText>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StudentClassCard
              classItem={item}
              studentId={studentId}
              studentName={studentName}
              onRequestEnrollment={handleEnrollment}
              onAttend={handleAttend}
            />
          )}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 16 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  identityCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  identityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    marginBottom: 4,
  },
  sectionHeading: {
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    marginBottom: 4,
  },
  helperText: {
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  badgeNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingVertical: 8,
  },
  historyDate: {
    fontSize: 14,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
});

