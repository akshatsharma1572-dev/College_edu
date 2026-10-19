import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Course, Subject, SubjectWithCourse } from '@/lib/supabase';
import { toast } from '@/components/Toast';
import { FullPageLoader } from '@/components/Spinner';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TextField, SelectField } from '@/components/FormFields';
import { ButtonSpinner } from '@/components/Spinner';

type Form = {
  subject_code: string;
  name: string;
  course_id: string;
  semester: number;
  credits: number;
  faculty: string;
};

export default function Subjects() {
  const [subjects, setSubjects] = useState<SubjectWithCourse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState<Form>(blankForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  function blankForm(): Form {
    return { subject_code: '', name: '', course_id: '', semester: 1, credits: 4, faculty: '' };
  }

  const load = useCallback(async () => {
    setLoading(true);
    const [s, c] = await Promise.all([
      supabase.from('subjects').select('*, course:courses(id, name, course_code)').order('name'),
      supabase.from('courses').select('*').order('name'),
    ]);
    if (s.error) toast('Failed to load subjects', 'error');
    else setSubjects(s.data as SubjectWithCourse[]);
    if (c.error) toast('Failed to load courses', 'error');
    else setCourses(c.data as Course[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subjects.filter((s) => {
      if (filterCourse !== 'all' && s.course_id !== filterCourse) return false;
      if (!q) return true;
      return [s.name, s.subject_code, s.faculty ?? '', s.course?.name ?? ''].some((v) =>
        v.toLowerCase().includes(q)
      );
    });
  }, [subjects, search, filterCourse]);

  function openAdd() {
    setEditing(null);
    setForm({ ...blankForm(), course_id: courses[0]?.id ?? '' });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(s: Subject) {
    setEditing(s);
    setForm({
      subject_code: s.subject_code,
      name: s.name,
      course_id: s.course_id ?? '',
      semester: s.semester,
      credits: s.credits,
      faculty: s.faculty ?? '',
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.subject_code.trim()) e.subject_code = 'Required';
    if (!form.name.trim()) e.name = 'Required';
    if (!form.course_id) e.course_id = 'Select a course';
    if (form.semester < 1) e.semester = 'Invalid';
    if (form.credits < 1) e.credits = 'Invalid';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    const payload = { ...form, faculty: form.faculty.trim() || null };
    if (editing) {
      const { error } = await supabase.from('subjects').update(payload).eq('id', editing.id);
      if (error) {
        toast(error.message.includes('unique') ? 'Subject code already exists' : 'Failed to update subject', 'error');
        setSaving(false);
        return;
      }
      toast('Subject updated');
    } else {
      const { error } = await supabase.from('subjects').insert(payload);
      if (error) {
        toast(error.message.includes('unique') ? 'Subject code already exists' : 'Failed to add subject', 'error');
        setSaving(false);
        return;
      }
      toast('Subject added');
    }
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from('subjects').delete().eq('id', toDelete.id);
    setDeleting(false);
    if (error) {
      toast('Failed to delete subject', 'error');
      return;
    }
    toast('Subject deleted');
    setToDelete(null);
    load();
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Subjects</h2>
          <p className="text-sm text-slate-500">{subjects.length} subject{subjects.length === 1 ? '' : 's'} total</p>
        </div>
        <button
          onClick={openAdd}
          disabled={courses.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          title={courses.length === 0 ? 'Add a course first' : ''}
        >
          <Plus size={16} /> Add Subject
        </button>
      </div>

      {courses.length === 0 && (
        <div className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          Add at least one course before creating subjects.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, faculty..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <FullPageLoader message="Loading subjects..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search || filterCourse !== 'all' ? 'No matching subjects' : 'No subjects yet'}
            message={search || filterCourse !== 'all' ? 'Try a different search or filter.' : 'Add subjects to assign them to courses and semesters.'}
            icon={<BookOpen size={24} />}
            action={!search && filterCourse === 'all' && courses.length > 0 && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
              >
                <Plus size={16} /> Add Subject
              </button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Sem</th>
                  <th className="px-4 py-3 font-semibold">Credits</th>
                  <th className="px-4 py-3 font-semibold">Faculty</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-xs font-medium text-brand-700">
                        {s.subject_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.course?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{s.semester}</td>
                    <td className="px-4 py-3 text-slate-600">{s.credits}</td>
                    <td className="px-4 py-3 text-slate-600">{s.faculty ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
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
        title={editing ? 'Edit Subject' : 'Add Subject'}
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Subject Code"
            value={form.subject_code}
            onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
            error={errors.subject_code}
            placeholder="e.g. CS301"
            className="font-mono"
          />
          <TextField
            label="Subject Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            placeholder="e.g. Data Structures"
          />
          <SelectField
            label="Course"
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            error={errors.course_id}
          >
            <option value="">Select course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SelectField>
          <SelectField
            label="Semester"
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
            error={errors.semester}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Semester {n}</option>
            ))}
          </SelectField>
          <SelectField
            label="Credits"
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
            error={errors.credits}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} credit{n === 1 ? '' : 's'}</option>
            ))}
          </SelectField>
          <TextField
            label="Faculty"
            value={form.faculty}
            onChange={(e) => setForm({ ...form, faculty: e.target.value })}
            placeholder="e.g. Dr. Jane Smith"
          />
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
            {editing ? 'Save Changes' : 'Add Subject'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete subject?"
        message={`"${toDelete?.name}" will be permanently removed. Any related attendance and marks records will also be deleted.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </div>
  );
}
