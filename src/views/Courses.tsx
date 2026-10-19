import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, GraduationCap, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Course } from '@/lib/supabase';
import { toast } from '@/components/Toast';
import { FullPageLoader } from '@/components/Spinner';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TextField, SelectField } from '@/components/FormFields';
import { ButtonSpinner } from '@/components/Spinner';

type Form = {
  course_code: string;
  name: string;
  department: string;
  duration_years: number;
  num_semesters: number;
};

const empty: Form = {
  course_code: '',
  name: '',
  department: '',
  duration_years: 4,
  num_semesters: 8,
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      toast('Failed to load courses', 'error');
    } else {
      setCourses(data as Course[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) =>
      [c.name, c.course_code, c.department].some((v) => v.toLowerCase().includes(q))
    );
  }, [courses, search]);

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(c: Course) {
    setEditing(c);
    setForm({
      course_code: c.course_code,
      name: c.name,
      department: c.department,
      duration_years: c.duration_years,
      num_semesters: c.num_semesters,
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.course_code.trim()) e.course_code = 'Required';
    if (!form.name.trim()) e.name = 'Required';
    if (!form.department.trim()) e.department = 'Required';
    if (form.duration_years < 1) e.duration_years = 'Must be at least 1';
    if (form.num_semesters < 1) e.num_semesters = 'Must be at least 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from('courses')
        .update(form)
        .eq('id', editing.id);
      if (error) {
        toast(error.message.includes('unique') ? 'Course code already exists' : 'Failed to update course', 'error');
        setSaving(false);
        return;
      }
      toast('Course updated');
    } else {
      const { error } = await supabase.from('courses').insert(form);
      if (error) {
        toast(error.message.includes('unique') ? 'Course code already exists' : 'Failed to add course', 'error');
        setSaving(false);
        return;
      }
      toast('Course added');
    }
    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from('courses').delete().eq('id', toDelete.id);
    setDeleting(false);
    if (error) {
      toast('Failed to delete course', 'error');
      return;
    }
    toast('Course deleted');
    setToDelete(null);
    load();
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Courses</h2>
          <p className="text-sm text-slate-500">{courses.length} course{courses.length === 1 ? '' : 's'} total</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="relative md:hidden">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <FullPageLoader message="Loading courses..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No matching courses' : 'No courses yet'}
            message={search ? 'Try a different search term.' : 'Add your first course to get started.'}
            icon={<GraduationCap size={24} />}
            action={!search && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
              >
                <Plus size={16} /> Add Course
              </button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Department</th>
                  <th className="px-4 py-3 font-semibold">Duration</th>
                  <th className="px-4 py-3 font-semibold">Semesters</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-xs font-medium text-brand-700">
                        {c.course_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.department}</td>
                    <td className="px-4 py-3 text-slate-600">{c.duration_years} year{c.duration_years === 1 ? '' : 's'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.num_semesters}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setToDelete(c)}
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
        title={editing ? 'Edit Course' : 'Add Course'}
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Course ID"
            value={form.course_code}
            onChange={(e) => setForm({ ...form, course_code: e.target.value })}
            error={errors.course_code}
            placeholder="e.g. BTECH-CS"
            className="font-mono"
          />
          <TextField
            label="Course Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            placeholder="e.g. B.Tech Computer Science"
          />
          <TextField
            label="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            error={errors.department}
            placeholder="e.g. Computer Engineering"
          />
          <SelectField
            label="Duration (years)"
            value={form.duration_years}
            onChange={(e) => setForm({ ...form, duration_years: Number(e.target.value) })}
            error={errors.duration_years}
          >
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>{y} year{y === 1 ? '' : 's'}</option>
            ))}
          </SelectField>
          <SelectField
            label="Number of Semesters"
            value={form.num_semesters}
            onChange={(e) => setForm({ ...form, num_semesters: Number(e.target.value) })}
            error={errors.num_semesters}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((s) => (
              <option key={s} value={s}>{s} semesters</option>
            ))}
          </SelectField>
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
            {editing ? 'Save Changes' : 'Add Course'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete course?"
        message={`"${toDelete?.name}" will be permanently removed. All subjects under this course will also be deleted.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </div>
  );
}
