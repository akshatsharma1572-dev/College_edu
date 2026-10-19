import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Hash,
  BookOpen,
  Layers,
  GraduationCap,
  TrendingUp,
  ClipboardCheck,
  FileText,
  Award,
  Save,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type {
  Attendance,
  Course,
  Marks,
  Student,
  StudentWithCourse,
  Subject,
} from '@/lib/supabase';
import { toast } from '@/components/Toast';
import { Spinner, ButtonSpinner } from '@/components/Spinner';
import Modal from '@/components/Modal';
import { TextField, SelectField, TextareaField } from '@/components/FormFields';
import EmptyState from '@/components/EmptyState';
import { attendanceColor, formatDate, gradeFromPercentage, initials } from '@/lib/academic';

type Props = { studentId: string; onBack: () => void };

type Tab = 'overview' | 'attendance' | 'marks' | 'subjects' | 'assignments';

type SubjectRow = Subject & { course?: Pick<Course, 'name'> | null };
type AttendanceRow = Attendance & { subject?: Pick<Subject, 'id' | 'name' | 'subject_code'> | null };
type MarksRow = Marks & { subject?: Pick<Subject, 'id' | 'name' | 'subject_code'> | null };

export default function StudentProfile({ studentId, onBack }: Props) {
  const [student, setStudent] = useState<StudentWithCourse | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [marks, setMarks] = useState<MarksRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, sub, att, mk, c] = await Promise.all([
      supabase
        .from('students')
        .select('*, course:courses(id, name, course_code)')
        .eq('id', studentId)
        .maybeSingle(),
      supabase
        .from('subjects')
        .select('*, course:courses(name)')
        .order('semester')
        .order('name'),
      supabase
        .from('student_attendance')
        .select('*, subject:subjects(id, name, subject_code)')
        .eq('student_id', studentId),
      supabase
        .from('student_marks')
        .select('*, subject:subjects(id, name, subject_code)')
        .eq('student_id', studentId),
      supabase.from('courses').select('*').order('name'),
    ]);
    if (s.error) toast('Failed to load student', 'error');
    else setStudent(s.data as StudentWithCourse);
    if (sub.error) toast('Failed to load subjects', 'error');
    else setSubjects(sub.data as SubjectRow[]);
    if (att.error) toast('Failed to load attendance', 'error');
    else setAttendance(att.data as AttendanceRow[]);
    if (mk.error) toast('Failed to load marks', 'error');
    else setMarks(mk.data as MarksRow[]);
    if (c.error) toast('Failed to load courses', 'error');
    else setCourses(c.data as Course[]);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const studentSubjects = useMemo(() => {
    if (!student) return [];
    return subjects.filter(
      (s) =>
        s.course_id === student.course_id && s.semester === student.semester
    );
  }, [subjects, student]);

  const overallPct = useMemo(() => {
    if (marks.length === 0) return 0;
    const total = marks.reduce(
      (a, m) => a + (m.internal_marks + m.assignment_marks + m.exam_marks),
      0
    );
    return Math.round(total / (marks.length * 3));
  }, [marks]);

  const overallAttendance = useMemo(() => {
    const att = attendance.reduce((a, r) => a + r.attended, 0);
    const tot = attendance.reduce((a, r) => a + r.total, 0);
    return tot > 0 ? Math.round((att / tot) * 100) : 0;
  }, [attendance]);

  const grade = gradeFromPercentage(overallPct);

  function openEdit() {
    if (!student) return;
    setEditForm({
      student_id: student.student_id,
      enrollment_number: student.enrollment_number,
      name: student.name,
      email: student.email ?? '',
      phone: student.phone ?? '',
      dob: student.dob ?? '',
      gender: student.gender ?? '',
      address: student.address ?? '',
      course_id: student.course_id ?? '',
      semester: String(student.semester),
      section: student.section ?? '',
      photo_url: student.photo_url ?? '',
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!student) return;
    setSaving(true);
    const payload = {
      student_id: editForm.student_id.trim(),
      enrollment_number: editForm.enrollment_number.trim(),
      name: editForm.name.trim(),
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
      dob: editForm.dob || null,
      gender: editForm.gender || null,
      address: editForm.address.trim() || null,
      course_id: editForm.course_id || null,
      semester: Number(editForm.semester) || 1,
      section: editForm.section.trim() || null,
      photo_url: editForm.photo_url.trim() || null,
    };
    const { error } = await supabase.from('students').update(payload).eq('id', student.id);
    setSaving(false);
    if (error) {
      toast(
        error.message.includes('unique') ? 'Student ID or enrollment number already exists' : 'Failed to save changes',
        'error'
      );
      return;
    }
    toast('Profile updated');
    setEditOpen(false);
    load();
  }

  const tabs: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'marks', label: 'Marks', icon: FileText },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: Award },
  ];

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-slate-500">
        <Spinner /> <span className="text-sm">Loading student profile...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <EmptyState
          title="Student not found"
          message="This student may have been deleted."
          action={
            <button
              onClick={onBack}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Back to students
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition"
      >
        <ArrowLeft size={16} /> Back to students
      </button>

      {/* Profile header card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="h-24 bg-gradient-to-r from-brand-600 to-brand-800" />
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.name}
                  className="-mt-12 h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-brand-100 text-2xl font-bold text-brand-700 shadow-md">
                  {initials(student.name)}
                </div>
              )}
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                <p className="text-sm text-slate-500">
                  {student.course?.name ?? 'Unassigned'} · Semester {student.semester}
                  {student.section ? ` · Section ${student.section}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={openEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition"
            >
              <Pencil size={16} /> Edit Profile
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatChip icon={Hash} label="Student ID" value={student.student_id} mono />
            <StatChip icon={Hash} label="Enrollment No." value={student.enrollment_number} mono />
            <StatChip icon={Mail} label="Email" value={student.email ?? '—'} />
            <StatChip icon={Phone} label="Phone" value={student.phone ?? '—'} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                  active
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {tab === 'overview' && (
            <OverviewTab
              student={student}
              subjects={studentSubjects}
              attendance={attendance}
              marks={marks}
              overallPct={overallPct}
              overallAttendance={overallAttendance}
              grade={grade}
            />
          )}
          {tab === 'attendance' && (
            <AttendanceTab attendance={attendance} studentSubjects={studentSubjects} studentId={student.id} />
          )}
          {tab === 'marks' && (
            <MarksTab marks={marks} studentSubjects={studentSubjects} studentId={student.id} />
          )}
          {tab === 'subjects' && <SubjectsTab subjects={studentSubjects} />}
          {tab === 'assignments' && <AssignmentsTab marks={marks} />}
        </div>
      </div>

      <Modal
        open={editOpen}
        title="Edit Student Profile"
        onClose={() => !saving && setEditOpen(false)}
        size="xl"
      >
        <div className="space-y-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Basic information</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Student ID" value={editForm.student_id ?? ''} onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })} className="font-mono" />
              <TextField label="Enrollment Number" value={editForm.enrollment_number ?? ''} onChange={(e) => setEditForm({ ...editForm, enrollment_number: e.target.value })} className="font-mono" />
              <TextField label="Full Name" value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <TextField label="Email" type="email" value={editForm.email ?? ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              <TextField label="Phone" value={editForm.phone ?? ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              <TextField label="Date of Birth" type="date" value={editForm.dob ?? ''} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
              <SelectField label="Gender" value={editForm.gender ?? ''} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </SelectField>
              <TextField label="Photo URL" value={editForm.photo_url ?? ''} onChange={(e) => setEditForm({ ...editForm, photo_url: e.target.value })} />
            </div>
            <div className="mt-4">
              <TextareaField label="Address" value={editForm.address ?? ''} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Academic information</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SelectField label="Course" value={editForm.course_id ?? ''} onChange={(e) => setEditForm({ ...editForm, course_id: e.target.value })}>
                <option value="">Unassigned</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </SelectField>
              <SelectField label="Semester" value={editForm.semester ?? '1'} onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>Semester {n}</option>
                ))}
              </SelectField>
              <SelectField label="Section" value={editForm.section ?? ''} onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}>
                <option value="">None</option>
                {['A', 'B', 'C', 'D'].map((s) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </SelectField>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setEditOpen(false)} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button onClick={saveEdit} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition">
            {saving ? <ButtonSpinner /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </Modal>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`truncate text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

function OverviewTab({
  student,
  subjects,
  attendance,
  marks,
  overallPct,
  overallAttendance,
  grade,
}: {
  student: StudentWithCourse;
  subjects: SubjectRow[];
  attendance: AttendanceRow[];
  marks: MarksRow[];
  overallPct: number;
  overallAttendance: number;
  grade: { grade: string; color: string };
}) {
  const info: { icon: typeof User; label: string; value: string }[] = [
    { icon: Hash, label: 'Student ID', value: student.student_id },
    { icon: Hash, label: 'Enrollment No.', value: student.enrollment_number },
    { icon: Mail, label: 'Email', value: student.email ?? '—' },
    { icon: Phone, label: 'Phone', value: student.phone ?? '—' },
    { icon: Calendar, label: 'Date of Birth', value: formatDate(student.dob) },
    { icon: User, label: 'Gender', value: student.gender ?? '—' },
    { icon: MapPin, label: 'Address', value: student.address ?? '—' },
    { icon: GraduationCap, label: 'Course', value: student.course?.name ?? '—' },
    { icon: Layers, label: 'Semester', value: `Semester ${student.semester}` },
    { icon: Layers, label: 'Section', value: student.section ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Overall Percentage" value={`${overallPct}%`} sub={marks.length > 0 ? `${marks.length} subjects graded` : 'No marks yet'} accent="brand" />
        <SummaryCard label="Overall Attendance" value={`${overallAttendance}%`} sub={`${attendance.length} subjects tracked`} accent={overallAttendance >= 75 ? 'success' : overallAttendance >= 60 ? 'warning' : 'error'} />
        <SummaryCard label="Grade" value={grade.grade} sub={`Based on ${overallPct}% average`} accent="brand" />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Student Information</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {info.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                  <Icon size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{row.label}</p>
                  <p className="text-sm text-slate-800 break-words">{row.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Academic Snapshot</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-semibold">Subject</th>
                <th className="px-4 py-2.5 font-semibold">Attendance</th>
                <th className="px-4 py-2.5 font-semibold">Marks (I/A/E)</th>
                <th className="px-4 py-2.5 font-semibold">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No subjects assigned for this course and semester yet.
                  </td>
                </tr>
              ) : (
                subjects.map((s) => {
                  const att = attendance.find((a) => a.subject_id === s.id);
                  const mk = marks.find((m) => m.subject_id === s.id);
                  const attPct = att && att.total > 0 ? Math.round((att.attended / att.total) * 100) : 0;
                  const mkPct = mk ? Math.round((mk.internal_marks + mk.assignment_marks + mk.exam_marks) / 3) : 0;
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-slate-800">{s.name}</p>
                        <p className="font-mono text-xs text-slate-400">{s.subject_code}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        {att ? (
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${attendanceColor(attPct)}`}>
                            {attPct}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Not tracked</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {mk ? `${mk.internal_marks}/${mk.assignment_marks}/${mk.exam_marks}` : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        {mk ? (
                          <span className="text-sm font-semibold text-slate-800">{mkPct}%</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: 'brand' | 'success' | 'warning' | 'error';
}) {
  const colors = {
    brand: 'border-brand-100 bg-brand-50/50',
    success: 'border-success-100 bg-success-50/50',
    warning: 'border-warning-100 bg-warning-50/50',
    error: 'border-error-100 bg-error-50/50',
  };
  const valueColors = {
    brand: 'text-brand-700',
    success: 'text-success-700',
    warning: 'text-warning-700',
    error: 'text-error-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[accent]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueColors[accent]}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function AttendanceTab({
  attendance,
  studentSubjects,
  studentId,
}: {
  attendance: AttendanceRow[];
  studentSubjects: SubjectRow[];
  studentId: string;
}) {
  const [editing, setEditing] = useState<Record<string, { attended: string; total: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const map: Record<string, { attended: string; total: string }> = {};
    studentSubjects.forEach((s) => {
      const att = attendance.find((a) => a.subject_id === s.id);
      map[s.id] = {
        attended: att ? String(att.attended) : '',
        total: att ? String(att.total) : '',
      };
    });
    setEditing(map);
  }, [attendance, studentSubjects]);

  async function save(subjectId: string) {
    const val = editing[subjectId];
    if (!val) return;
    const attended = Number(val.attended) || 0;
    const total = Number(val.total) || 0;
    if (attended > total) {
      toast('Attended cannot exceed total classes', 'error');
      return;
    }
    setSaving(subjectId);
    const existing = attendance.find((a) => a.subject_id === subjectId);
    if (existing) {
      const { error } = await supabase
        .from('student_attendance')
        .update({ attended, total })
        .eq('id', existing.id);
      if (error) toast('Failed to update attendance', 'error');
      else toast('Attendance saved');
    } else {
      const { error } = await supabase
        .from('student_attendance')
        .insert({ student_id: studentId, subject_id: subjectId, attended, total });
      if (error) toast('Failed to save attendance', 'error');
      else toast('Attendance saved');
    }
    setSaving(null);
  }

  if (studentSubjects.length === 0) {
    return <EmptyState title="No subjects" message="No subjects are assigned for this student's course and semester." icon={<BookOpen size={24} />} />;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Enter classes attended and total classes conducted for each subject. Changes save per row.
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 font-semibold">Subject</th>
              <th className="px-4 py-2.5 font-semibold">Attended</th>
              <th className="px-4 py-2.5 font-semibold">Total</th>
              <th className="px-4 py-2.5 font-semibold">Percentage</th>
              <th className="px-4 py-2.5 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {studentSubjects.map((s) => {
              const val = editing[s.id] ?? { attended: '', total: '' };
              const att = Number(val.attended) || 0;
              const tot = Number(val.total) || 0;
              const pct = tot > 0 ? Math.round((att / tot) * 100) : 0;
              return (
                <tr key={s.id}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="font-mono text-xs text-slate-400">{s.subject_code}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min={0}
                      value={val.attended}
                      onChange={(e) => setEditing({ ...editing, [s.id]: { ...val, attended: e.target.value } })}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min={0}
                      value={val.total}
                      onChange={(e) => setEditing({ ...editing, [s.id]: { ...val, total: e.target.value } })}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    {tot > 0 ? (
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${attendanceColor(pct)}`}>
                        {pct}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => save(s.id)}
                      disabled={saving === s.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition"
                    >
                      {saving === s.id && <ButtonSpinner />}
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarksTab({
  marks,
  studentSubjects,
  studentId,
}: {
  marks: MarksRow[];
  studentSubjects: SubjectRow[];
  studentId: string;
}) {
  const [editing, setEditing] = useState<Record<string, { internal: string; assignment: string; exam: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const map: Record<string, { internal: string; assignment: string; exam: string }> = {};
    studentSubjects.forEach((s) => {
      const mk = marks.find((m) => m.subject_id === s.id);
      map[s.id] = {
        internal: mk ? String(mk.internal_marks) : '',
        assignment: mk ? String(mk.assignment_marks) : '',
        exam: mk ? String(mk.exam_marks) : '',
      };
    });
    setEditing(map);
  }, [marks, studentSubjects]);

  async function save(subjectId: string) {
    const val = editing[subjectId];
    if (!val) return;
    const internal_marks = Math.min(100, Math.max(0, Number(val.internal) || 0));
    const assignment_marks = Math.min(100, Math.max(0, Number(val.assignment) || 0));
    const exam_marks = Math.min(100, Math.max(0, Number(val.exam) || 0));
    setSaving(subjectId);
    const existing = marks.find((m) => m.subject_id === subjectId);
    if (existing) {
      const { error } = await supabase
        .from('student_marks')
        .update({ internal_marks, assignment_marks, exam_marks })
        .eq('id', existing.id);
      if (error) toast('Failed to update marks', 'error');
      else toast('Marks saved');
    } else {
      const { error } = await supabase
        .from('student_marks')
        .insert({ student_id: studentId, subject_id: subjectId, internal_marks, assignment_marks, exam_marks });
      if (error) toast('Failed to save marks', 'error');
      else toast('Marks saved');
    }
    setSaving(null);
  }

  if (studentSubjects.length === 0) {
    return <EmptyState title="No subjects" message="No subjects are assigned for this student's course and semester." icon={<BookOpen size={24} />} />;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Each component is scored out of 100. Overall subject percentage is the average of the three.</p>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5 font-semibold">Subject</th>
              <th className="px-4 py-2.5 font-semibold">Internal</th>
              <th className="px-4 py-2.5 font-semibold">Assignment</th>
              <th className="px-4 py-2.5 font-semibold">Exam</th>
              <th className="px-4 py-2.5 font-semibold">Overall</th>
              <th className="px-4 py-2.5 font-semibold">Grade</th>
              <th className="px-4 py-2.5 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {studentSubjects.map((s) => {
              const val = editing[s.id] ?? { internal: '', assignment: '', exam: '' };
              const avg = Math.round(((Number(val.internal) || 0) + (Number(val.assignment) || 0) + (Number(val.exam) || 0)) / 3);
              const g = gradeFromPercentage(avg);
              return (
                <tr key={s.id}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="font-mono text-xs text-slate-400">{s.subject_code}</p>
                  </td>
                  {['internal', 'assignment', 'exam'].map((k) => (
                    <td key={k} className="px-4 py-2.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={(val as Record<string, string>)[k]}
                        onChange={(e) => setEditing({ ...editing, [s.id]: { ...val, [k]: e.target.value } })}
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{avg}%</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${g.color}`}>
                      {g.grade}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => save(s.id)}
                      disabled={saving === s.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition"
                    >
                      {saving === s.id && <ButtonSpinner />}
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubjectsTab({ subjects }: { subjects: SubjectRow[] }) {
  if (subjects.length === 0) {
    return <EmptyState title="No subjects" message="No subjects are assigned for this student's course and semester." icon={<BookOpen size={24} />} />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2.5 font-semibold">Code</th>
            <th className="px-4 py-2.5 font-semibold">Subject</th>
            <th className="px-4 py-2.5 font-semibold">Semester</th>
            <th className="px-4 py-2.5 font-semibold">Credits</th>
            <th className="px-4 py-2.5 font-semibold">Faculty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subjects.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-2.5">
                <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-xs font-medium text-brand-700">{s.subject_code}</span>
              </td>
              <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
              <td className="px-4 py-2.5 text-slate-600">{s.semester}</td>
              <td className="px-4 py-2.5 text-slate-600">{s.credits}</td>
              <td className="px-4 py-2.5 text-slate-600">{s.faculty ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssignmentsTab({ marks }: { marks: MarksRow[] }) {
  const withMarks = marks.filter((m) => m.subject?.name);
  if (withMarks.length === 0) {
    return <EmptyState title="No assignment marks" message="Assignment marks will appear here once they are entered in the Marks tab." icon={<Award size={24} />} />;
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {withMarks.map((m) => {
        const pct = Math.round((m.assignment_marks / 100) * 100);
        const g = gradeFromPercentage(pct);
        return (
          <div key={m.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-800">{m.subject?.name}</p>
              <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${g.color}`}>{g.grade}</span>
            </div>
            <p className="font-mono text-xs text-slate-400">{m.subject?.subject_code}</p>
            <div className="mt-3">
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-slate-900">{m.assignment_marks}</span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${Math.min(100, m.assignment_marks)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
