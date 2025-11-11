import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  AttendanceStatus,
  ClassRecord,
  formatDateTime,
  getSessionStatus,
  useAttendance,
} from '@/context/AttendanceContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  pending: 'Pending',
  present: 'Present',
  absent: 'Absent',
};

const parseDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return new Date();
  }

  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

type SessionInputState = Record<string, string>;

type ClassItemProps = {
  classItem: ClassRecord;
  sessionInputs: SessionInputState;
  onSessionInputChange: (classId: string, value: string) => void;
  onScheduleSession: (classId: string) => void;
  onConfirmEnrollment: (classId: string, enrollmentId: string) => void;
  onUpdateAttendance: (
    classId: string,
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) => void;
};

const ClassItem = ({
  classItem,
  sessionInputs,
  onSessionInputChange,
  onScheduleSession,
  onConfirmEnrollment,
  onUpdateAttendance,
}: ClassItemProps) => {
  const pendingEnrollments = classItem.enrollments.filter((enrollment) => enrollment.status === 'pending');
  const confirmedEnrollments = classItem.enrollments.filter((enrollment) => enrollment.status === 'confirmed');
  const sessions = [...classItem.sessions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  const activeSessions = sessions.filter((session) => getSessionStatus(session) === 'in-progress');

  return (
    <ThemedView style={styles.classCard} lightColor="#ffffff" darkColor="#111827">
      <ThemedText type="subtitle" style={styles.classTitle}>
        {classItem.title}
      </ThemedText>
      <ThemedText style={styles.metaText}>Instructor: {classItem.teacher}</ThemedText>
      {classItem.description ? (
        <ThemedText style={styles.metaText}>{classItem.description}</ThemedText>
      ) : null}

      <View style={styles.statRow}>
        <ThemedText style={styles.statLabel}>Confirmed: {confirmedEnrollments.length}</ThemedText>
        <ThemedText style={styles.statLabel}>Pending: {pendingEnrollments.length}</ThemedText>
        <ThemedText style={styles.statLabel}>Sessions: {classItem.sessions.length}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold">Start a session</ThemedText>
        <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
          Provide a start date and time (e.g., 2025-08-21 09:00). Leave empty to use the current time.
        </ThemedText>
        <TextInput
          placeholder="YYYY-MM-DD HH:mm"
          value={sessionInputs[classItem.id] ?? ''}
          onChangeText={(text) => onSessionInputChange(classItem.id, text)}
          style={styles.input}
        />
        <Pressable
          onPress={() => onScheduleSession(classItem.id)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <ThemedText style={styles.primaryButtonText}>Schedule session</ThemedText>
        </Pressable>
      </View>

      {pendingEnrollments.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">Enrollment requests</ThemedText>
          {pendingEnrollments.map((enrollment) => (
            <View key={enrollment.id} style={styles.enrollmentRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.enrollmentName}>{enrollment.studentName}</ThemedText>
                <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
                  Requested {formatDateTime(enrollment.requestedAt)}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => onConfirmEnrollment(classItem.id, enrollment.id)}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <ThemedText style={styles.secondaryButtonText}>Confirm</ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {activeSessions.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">Active attendance</ThemedText>
          {activeSessions.map((session) => (
            <View key={session.id} style={styles.sessionContainer}>
              <ThemedText
                style={styles.helperText}
                lightColor="#6b7280"
                darkColor="#9ca3af"
              >
                Started {formatDateTime(session.startTime)}
              </ThemedText>
              {confirmedEnrollments.length === 0 ? (
                <ThemedText
                  style={styles.helperText}
                  lightColor="#6b7280"
                  darkColor="#9ca3af"
                >
                  No confirmed students yet.
                </ThemedText>
              ) : (
                confirmedEnrollments.map((enrollment) => (
                  <View key={enrollment.id} style={styles.attendanceRow}>
                    <ThemedText style={styles.enrollmentName}>{enrollment.studentName}</ThemedText>
                    <ThemedText style={styles.attendanceStatus}>
                      {AttendanceStatusLabels[session.attendance[enrollment.studentId] ?? 'pending']}
                    </ThemedText>
                    <View style={styles.attendanceButtons}>
                      <Pressable
                        onPress={() =>
                          onUpdateAttendance(classItem.id, session.id, enrollment.studentId, 'present')
                        }
                        style={({ pressed }) => [styles.presentButton, pressed && styles.buttonPressed]}
                      >
                        <ThemedText style={styles.buttonLabel}>Present</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          onUpdateAttendance(classItem.id, session.id, enrollment.studentId, 'absent')
                        }
                        style={({ pressed }) => [styles.absentButton, pressed && styles.buttonPressed]}
                      >
                        <ThemedText style={styles.buttonLabel}>Absent</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          ))}
        </View>
      ) : null}

      {sessions.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold">Session history</ThemedText>
          {sessions.map((session) => (
            <View key={session.id} style={styles.sessionRow}>
              <ThemedText style={styles.sessionStatus}>
                {formatDateTime(session.startTime)} · {getSessionStatus(session)}
              </ThemedText>
              <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
                Present: {Object.values(session.attendance).filter((status) => status === 'present').length} ·
                Absent: {Object.values(session.attendance).filter((status) => status === 'absent').length}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </ThemedView>
  );
};

export default function TeacherScreen() {
  const { classes, addClass, confirmEnrollment, createSession, setAttendanceStatus, buildReport } =
    useAttendance();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [sessionInputs, setSessionInputs] = useState<SessionInputState>({});

  const reports = useMemo(() => classes.map((cls) => buildReport(cls.id)), [classes, buildReport]);

  const handleAddClass = () => {
    if (!title.trim() || !teacherName.trim()) {
      Alert.alert('Missing information', 'Provide both a class title and teacher name.');
      return;
    }

    addClass({ title: title.trim(), description: description.trim(), teacher: teacherName.trim() });
    setTitle('');
    setDescription('');
    setTeacherName('');
    Alert.alert('Class created', 'Your class has been added to the roster.');
  };

  const handleSessionInputChange = (classId: string, value: string) => {
    setSessionInputs((prev) => ({ ...prev, [classId]: value }));
  };

  const handleScheduleSession = (classId: string) => {
    const rawValue = sessionInputs[classId] ?? '';
    const parsedDate = parseDateInput(rawValue);
    if (!parsedDate) {
      Alert.alert('Invalid date', 'Use the format YYYY-MM-DD HH:mm or a valid ISO string.');
      return;
    }

    createSession(classId, parsedDate.toISOString());
    setSessionInputs((prev) => ({ ...prev, [classId]: '' }));
    Alert.alert('Session scheduled', `Class session starts at ${formatDateTime(parsedDate.toISOString())}.`);
  };

  const handleConfirmEnrollment = (classId: string, enrollmentId: string) => {
    confirmEnrollment(classId, enrollmentId);
    Alert.alert('Enrollment confirmed', 'The student has been enrolled.');
  };

  const handleUpdateAttendance = (
    classId: string,
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) => {
    setAttendanceStatus(classId, sessionId, studentId, status);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.sectionCard} lightColor="#ffffff" darkColor="#1f2933">
        <ThemedText type="title" style={styles.heading}>
          Teacher workspace
        </ThemedText>
        <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
          Create new classes, approve enrollments, and manage attendance in real time.
        </ThemedText>
        <View style={styles.formRow}>
          <TextInput
            placeholder="Class title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TextInput
            placeholder="Instructor name"
            value={teacherName}
            onChangeText={setTeacherName}
            style={styles.input}
          />
          <TextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.multilineInput]}
            multiline
          />
          <Pressable onPress={handleAddClass} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
            <ThemedText style={styles.primaryButtonText}>Add class</ThemedText>
          </Pressable>
        </View>
      </ThemedView>

      <ThemedText type="subtitle" style={styles.sectionHeading}>
        Active classes
      </ThemedText>

      {classes.length === 0 ? (
        <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
          No classes yet. Create one to get started.
        </ThemedText>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClassItem
              classItem={item}
              sessionInputs={sessionInputs}
              onSessionInputChange={handleSessionInputChange}
              onScheduleSession={handleScheduleSession}
              onConfirmEnrollment={handleConfirmEnrollment}
              onUpdateAttendance={handleUpdateAttendance}
            />
          )}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 16 }}
        />
      )}

      <ThemedText type="subtitle" style={styles.sectionHeading}>
        Attendance report
      </ThemedText>
      {reports.length === 0 ? (
        <ThemedText style={styles.helperText} lightColor="#6b7280" darkColor="#9ca3af">
          Reports will appear when you add classes.
        </ThemedText>
      ) : (
        <View style={styles.reportTable}>
          <View style={[styles.reportRow, styles.reportHeader]}>
            <ThemedText style={[styles.reportCell, styles.reportHeaderText]}>Class</ThemedText>
            <ThemedText style={[styles.reportCell, styles.reportHeaderText]}>Sessions</ThemedText>
            <ThemedText style={[styles.reportCell, styles.reportHeaderText]}>Students</ThemedText>
            <ThemedText style={[styles.reportCell, styles.reportHeaderText]}>Present</ThemedText>
            <ThemedText style={[styles.reportCell, styles.reportHeaderText]}>Absent</ThemedText>
          </View>
          {reports.map((report) => (
            <View key={report.classId} style={styles.reportRow}>
              <ThemedText style={styles.reportCell}>{report.classTitle}</ThemedText>
              <ThemedText style={styles.reportCell}>{report.totalSessions}</ThemedText>
              <ThemedText style={styles.reportCell}>{report.totalConfirmedStudents}</ThemedText>
              <ThemedText style={styles.reportCell}>{report.presentCount}</ThemedText>
              <ThemedText style={styles.reportCell}>{report.absentCount}</ThemedText>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  heading: {
    marginBottom: 4,
  },
  sectionHeading: {
    marginTop: 8,
    marginBottom: 8,
  },
  helperText: {
    marginBottom: 4,
  },
  formRow: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
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
  classCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  classTitle: {
    marginBottom: 4,
  },
  metaText: {
    color: '#4d4d4d',
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statLabel: {
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  secondaryButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  enrollmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enrollmentName: {
    fontWeight: '600',
  },
  sessionContainer: {
    gap: 12,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attendanceStatus: {
    minWidth: 80,
    fontWeight: '600',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presentButton: {
    backgroundColor: '#4caf50',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  absentButton: {
    backgroundColor: '#f44336',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  sessionRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
    marginTop: 12,
    gap: 4,
  },
  sessionStatus: {
    fontWeight: '600',
  },
  reportTable: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  reportRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reportHeader: {
    backgroundColor: '#f3f4f6',
  },
  reportHeaderText: {
    fontWeight: '700',
  },
  reportCell: {
    flex: 1,
    fontSize: 14,
  },
});

