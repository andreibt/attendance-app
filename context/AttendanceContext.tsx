import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type EnrollmentStatus = 'pending' | 'confirmed';
export type AttendanceStatus = 'pending' | 'present' | 'absent';

export type Enrollment = {
  id: string;
  studentId: string;
  studentName: string;
  status: EnrollmentStatus;
  requestedAt: string;
  confirmedAt?: string;
};

export type Session = {
  id: string;
  startTime: string;
  attendance: Record<string, AttendanceStatus>;
};

export type ClassRecord = {
  id: string;
  title: string;
  description?: string;
  teacher: string;
  createdAt: string;
  enrollments: Enrollment[];
  sessions: Session[];
};

export type AttendanceReportRow = {
  classId: string;
  classTitle: string;
  totalSessions: number;
  totalConfirmedStudents: number;
  presentCount: number;
  absentCount: number;
};

type AttendanceContextValue = {
  classes: ClassRecord[];
  addClass: (payload: { title: string; description?: string; teacher: string }) => void;
  requestEnrollment: (classId: string, student: { studentId: string; studentName: string }) => void;
  confirmEnrollment: (classId: string, enrollmentId: string) => void;
  createSession: (classId: string, startTime: string) => void;
  setAttendanceStatus: (
    classId: string,
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) => void;
  markAttendanceForStudent: (classId: string, studentId: string) => { success: boolean; reason?: string };
  buildReport: (classId: string) => AttendanceReportRow;
};

const AttendanceContext = createContext<AttendanceContextValue | undefined>(undefined);

const SESSION_DURATION_MINUTES = 90;

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`;

const makeAttendanceRecord = (enrollments: Enrollment[]) => {
  return enrollments
    .filter((enrollment) => enrollment.status === 'confirmed')
    .reduce<Record<string, AttendanceStatus>>((acc, enrollment) => {
      acc[enrollment.studentId] = 'pending';
      return acc;
    }, {});
};

const nowIso = () => new Date().toISOString();

const sampleClassId = createId('class');
const sampleConfirmedEnrollment: Enrollment = {
  id: createId('enroll'),
  studentId: 'avery-green',
  studentName: 'Avery Green',
  status: 'confirmed',
  requestedAt: nowIso(),
  confirmedAt: nowIso(),
};

const samplePendingEnrollment: Enrollment = {
  id: createId('enroll'),
  studentId: 'jordan-smith',
  studentName: 'Jordan Smith',
  status: 'pending',
  requestedAt: nowIso(),
};

const sampleSession: Session = {
  id: createId('session'),
  startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  attendance: {
    [sampleConfirmedEnrollment.studentId]: 'present',
  },
};

const initialClasses: ClassRecord[] = [
  {
    id: sampleClassId,
    title: 'Mobile App Fundamentals',
    description: 'Weekly seminar focused on attendance analytics and classroom workflows.',
    teacher: 'Prof. Rivera',
    createdAt: nowIso(),
    enrollments: [sampleConfirmedEnrollment, samplePendingEnrollment],
    sessions: [sampleSession],
  },
];

export const AttendanceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [classes, setClasses] = useState<ClassRecord[]>(initialClasses);

  const addClass: AttendanceContextValue['addClass'] = useCallback(({ title, description, teacher }) => {
    setClasses((prev) => [
      ...prev,
      {
        id: createId('class'),
        title,
        description,
        teacher,
        createdAt: nowIso(),
        enrollments: [],
        sessions: [],
      },
    ]);
  }, []);

  const requestEnrollment: AttendanceContextValue['requestEnrollment'] = useCallback(
    (classId, { studentId, studentName }) => {
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id !== classId) return cls;

          const existing = cls.enrollments.find((enrollment) => enrollment.studentId === studentId);
          if (existing) {
            return cls;
          }

          const newEnrollment: Enrollment = {
            id: createId('enroll'),
            studentId,
            studentName,
            status: 'pending',
            requestedAt: nowIso(),
          };

          return {
            ...cls,
            enrollments: [...cls.enrollments, newEnrollment],
          };
        })
      );
    },
    []
  );

  const confirmEnrollment: AttendanceContextValue['confirmEnrollment'] = useCallback((classId, enrollmentId) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;

        const updatedEnrollments = cls.enrollments.map((enrollment) => {
          if (enrollment.id !== enrollmentId) return enrollment;

          return {
            ...enrollment,
            status: 'confirmed',
            confirmedAt: nowIso(),
          };
        });

        const latestEnrollment = updatedEnrollments.find((enrollment) => enrollment.id === enrollmentId);

        const updatedSessions = latestEnrollment && latestEnrollment.status === 'confirmed'
          ? cls.sessions.map((session) => {
              if (session.attendance[latestEnrollment.studentId]) {
                return session;
              }
              return {
                ...session,
                attendance: {
                  ...session.attendance,
                  [latestEnrollment.studentId]: 'pending',
                },
              };
            })
          : cls.sessions;

        return {
          ...cls,
          enrollments: updatedEnrollments,
          sessions: updatedSessions,
        };
      })
    );
  }, []);

  const createSession: AttendanceContextValue['createSession'] = useCallback((classId, startTime) => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;

        const session: Session = {
          id: createId('session'),
          startTime,
          attendance: makeAttendanceRecord(cls.enrollments),
        };

        return {
          ...cls,
          sessions: [...cls.sessions, session],
        };
      })
    );
  }, []);

  const setAttendanceStatus: AttendanceContextValue['setAttendanceStatus'] = useCallback(
    (classId, sessionId, studentId, status) => {
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id !== classId) return cls;

          const sessions = cls.sessions.map((session) => {
            if (session.id !== sessionId) return session;

            if (!session.attendance[studentId]) {
              return session;
            }

            return {
              ...session,
              attendance: {
                ...session.attendance,
                [studentId]: status,
              },
            };
          });

          return {
            ...cls,
            sessions,
          };
        })
      );
    },
    []
  );

  const markAttendanceForStudent: AttendanceContextValue['markAttendanceForStudent'] = useCallback(
    (classId, studentId) => {
      let updated = false;
      let reason: string | undefined;

      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id !== classId) return cls;

          const sessions = cls.sessions.map((session) => {
            const start = new Date(session.startTime).getTime();
            const end = start + SESSION_DURATION_MINUTES * 60 * 1000;
            const now = Date.now();
            const isActive = now >= start && now <= end;

            if (!isActive) return session;

            const currentStatus = session.attendance[studentId];
            if (!currentStatus) {
              reason = 'You are not enrolled in this class.';
              return session;
            }

            if (currentStatus === 'present') {
              reason = 'Attendance already confirmed.';
              return session;
            }

            updated = true;
            return {
              ...session,
              attendance: {
                ...session.attendance,
                [studentId]: 'present',
              },
            };
          });

          return {
            ...cls,
            sessions,
          };
        })
      );

      if (!updated && !reason) {
        reason = 'No active session is currently running.';
      }

      return { success: updated, reason };
    },
    []
  );

  const buildReport: AttendanceContextValue['buildReport'] = useCallback(
    (classId) => {
      const targetClass = classes.find((cls) => cls.id === classId);

      if (!targetClass) {
        return {
          classId,
          classTitle: '',
          totalSessions: 0,
          totalConfirmedStudents: 0,
          presentCount: 0,
          absentCount: 0,
        };
      }

      const totalConfirmedStudents = targetClass.enrollments.filter((enrollment) => enrollment.status === 'confirmed').length;

      const attendanceTotals = targetClass.sessions.reduce(
        (acc, session) => {
          Object.values(session.attendance).forEach((status) => {
            if (status === 'present') acc.present += 1;
            if (status === 'absent') acc.absent += 1;
          });
          return acc;
        },
        { present: 0, absent: 0 }
      );

      return {
        classId: targetClass.id,
        classTitle: targetClass.title,
        totalSessions: targetClass.sessions.length,
        totalConfirmedStudents,
        presentCount: attendanceTotals.present,
        absentCount: attendanceTotals.absent,
      };
    },
    [classes]
  );

  const value = useMemo<AttendanceContextValue>(
    () => ({
      classes,
      addClass,
      requestEnrollment,
      confirmEnrollment,
      createSession,
      setAttendanceStatus,
      markAttendanceForStudent,
      buildReport,
    }),
    [classes, addClass, requestEnrollment, confirmEnrollment, createSession, setAttendanceStatus, markAttendanceForStudent, buildReport]
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export const getSessionStatus = (session: Session) => {
  const start = new Date(session.startTime).getTime();
  const end = start + SESSION_DURATION_MINUTES * 60 * 1000;
  const now = Date.now();

  if (now < start) return 'upcoming' as const;
  if (now >= start && now <= end) return 'in-progress' as const;
  return 'completed' as const;
};

export type SessionStatus = ReturnType<typeof getSessionStatus>;

export const formatDateTime = (iso: string) => {
  try {
    const date = new Date(iso);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    return iso;
  }
};

