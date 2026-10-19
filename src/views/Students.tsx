import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Eye, Pencil, Trash2, Search, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Course, Student, StudentWithCourse } from '@/lib/supabase';
import { toast } from '@/components/Toast';
import { FullPageLoader } from '@/components/Spinner';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TextField, SelectField, TextareaField } from '@/components/FormFields';
import { ButtonSpinner } from '@/components/Spinner';
import { initials } from '@/lib/academic';

type Props = { onView: (id: string) => void };

type Form = {
  student_id: string;
  enrollment_number: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  course_id: string;
  semester: number;
  section: string;
  photo_url: string;
};

function blank(): Form {
  return {
    student_id: '',
    enrollment_number: '',
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    course_id: '',
    semester: 1,
    section: 'A',
    photo_url: '',
  };
}

export default function Students({ onView }: Props) {
  const [students, setStudents] = useState<StudentWithCourse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Form>(blank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, c] = await Promise.all([
      supabase.from('students').select('*, course:courses(id, name, course_code)').order('name'),
      supabase.from('courses').select('*').order('name'),
    ]);
    if (s.error) toast('Failed to load students', 'error');
    else setStudents(s.data as StudentWithCourse[]);
    if (c.error) toast('Failed to load courses', 'error');
    else setCourses(c.data as Course[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.name, s.student_id, s.enrollment_number, s.email ?? '', s.course?.name ?? ''].some((v) =>
        v.toLowerCase().includes(q)
      )
    );
  }, [students, search]);

  function openAdd() {
    setEditing(null);
    setForm({ ...blank(), course_id: courses[0]?.id ?? '' });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({
      student_id: s.student_id,
      enrollment_number: s.enrollment_number,
      name: s.name,
      email: s.email ?? '',
      phone: s.phone ?? '',
      dob: s.dob ?? '',
      gender: s.gender ?? '',
      address: s.address ?? '',
      course_id: s.course_id ?? '',
      semester: s.semester,
      section: s.section ?? '',
      photo_url: s.photo_url ?? '',
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.student_id.trim()) e.student_id = 'Required';
    if (!form.enrollment_number.trim()) e.enrollment_number = 'Required';
    if (!form.name.trim()) e.name = 'Required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      ...form,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      dob: form.dob || null,
      gender: form.gender || null,
      address: form.address.trim() || null,
      section: form.section.trim() || null,
      photo_url: form.photo_url.trim() || null,
      course_id: form.course_id || null,
    };
    if (editing) {
      const { error } = await supabase.from('students').update(payload).eq('id', editing.id);
      if (error) {
        toast(
          error.message.includes('unique') ? 'Student ID or enrollment number already exists' : 'Failed to update student',
          'error'
        );
        setSaving(false);
        return;
      }
      toast('Student updated');
    } else {
      const { error } = await supabase.from('students').insert(payload);
      if (error) {
        toast(
          error.message.includes('unique') ? 'Student ID or enrollment number already exists' : 'Failed to add student',
          'error'
        );
        setSaving(false);
        return;
      }
      toast('Student added');
    }
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from('students').delete().eq('id', toDelete.id);
    setDeleting(false);
    if (error) {
      toast('Failed to delete student', 'error');
      return;
    }
    toast('Student deleted');
    setToDelete(null);
    load();
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Students</h2>
          <p className="text-sm text-slate-500">{students.length} student{students.length === 1 ? '' : 's'} total</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          <Plus size={16} /> Add Student
        </button>
      </div>

      <div className="relative md:hidden">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <FullPageLoader message="Loading students..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No matching students' : 'No students yet'}
            message={search ? 'Try a different search term.' : 'Add your first student to start tracking their academic information.'}
            icon={<Users size={24} />}
            action={!search && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
              >
                <Plus size={16} /> Add Student
              </button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Student ID</th>
                  <th className="px-4 py-3 font-semibold">Enrollment</th>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Sem / Sec</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.photo_url ? (
                          <img src={s.photo_url} alt={s.name} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {initials(s.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.student_id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.enrollment_number}</td>
                    <td className="px-4 py-3 text-slate-600">{s.course?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <span>S{s.semester}</span>
                        <span className="text-slate-300">·</span>
                        <span>{s.section ?? '—'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onView(s.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                          title="View profile"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setToDelete(s)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-error-50 hover:text-error-600 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Student' : 'Add Student'}
        onClose={() => setModalOpen(false)}
        size="xl"
      >
        <div className="space-y-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Basic information</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Student ID"
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                error={errors.student_id}
                placeholder="e.g. STU001"
                className="font-mono"
              />
              <TextField
                label="Enrollment Number"
                value={form.enrollment_number}
                onChange={(e) => setForm({ ...form, enrollment_number: e.target.value })}
                error={errors.enrollment_number}
                placeholder="e.g. ENR2026001"
                className="font-mono"
              />
              <TextField
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
                placeholder="e.g. Alex Carter"
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
                placeholder="e.g. alex@college.edu"
              />
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +1 555 000 1234"
              />
              <TextField
                label="Date of Birth"
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
              <SelectField
                label="Gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </SelectField>
              <TextField
                label="Photo URL"
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                placeholder="https://..."
                hint="Optional image URL"
              />
            </div>
            <div className="mt-4">
              <TextareaField
                label="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, city, state, postal code"
              />
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Academic information</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SelectField
                label="Course"
                value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              >
                <option value="">Unassigned</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </SelectField>
              <SelectField
                label="Semester"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>Semester {n}</option>
                ))}
              </SelectField>
              <SelectField
                label="Section"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              >
                {['A', 'B', 'C', 'D'].map((s) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </SelectField>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setModalOpen(false)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 transition"
          >
            {saving && <ButtonSpinner />}
            {editing ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete student?"
        message={`"${toDelete?.name}" will be permanently removed, along with their attendance and marks records.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </div>
  );
}
