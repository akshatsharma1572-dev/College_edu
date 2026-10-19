import { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { View } from '@/components/Sidebar';
import { Spinner } from '@/components/Spinner';
import EmptyState from '@/components/EmptyState';

type Props = { onNavigate: (v: View) => void };

type Stats = {
  students: number;
  courses: number;
  subjects: number;
  avgAttendance: number;
};

export default function Dashboard({ onNavigate }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, c, sub, att] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('student_attendance').select('attended, total'),
      ]);
      const totalAtt = (att.data ?? []).reduce((a, r) => a + r.attended, 0);
      const totalCls = (att.data ?? []).reduce((a, r) => a + r.total, 0);
      setStats({
        students: s.count ?? 0,
        courses: c.count ?? 0,
        subjects: sub.count ?? 0,
        avgAttendance: totalCls > 0 ? Math.round((totalAtt / totalCls) * 100) : 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-slate-500">
          <Spinner /> <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const cards: {
    label: string;
    value: number | string;
    icon: typeof Users;
    color: string;
    view: View;
  }[] = [
    { label: 'Students', value: stats.students, icon: Users, color: 'bg-brand-50 text-brand-600', view: 'students' },
    { label: 'Courses', value: stats.courses, icon: GraduationCap, color: 'bg-success-50 text-success-600', view: 'courses' },
    { label: 'Subjects', value: stats.subjects, icon: BookOpen, color: 'bg-warning-50 text-warning-600', view: 'subjects' },
    { label: 'Avg Attendance', value: `${stats.avgAttendance}%`, icon: TrendingUp, color: 'bg-slate-100 text-slate-700', view: 'students' },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-card-hover">
        <h2 className="text-xl font-semibold">Welcome to EduAdmin</h2>
        <p className="mt-1 text-sm text-brand-100">
          Manage students, courses, subjects, attendance, and academic performance in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => onNavigate(card.view)}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card transition hover:shadow-card-hover hover:border-brand-200"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon size={20} />
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-500"
                />
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
          <p className="mt-1 text-xs text-slate-500">Jump to the most common administration tasks.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickAction label="View all students" desc="Browse and manage student profiles" onClick={() => onNavigate('students')} />
            <QuickAction label="Manage courses" desc="Add or edit course programs" onClick={() => onNavigate('courses')} />
            <QuickAction label="Manage subjects" desc="Assign subjects to courses and semesters" onClick={() => onNavigate('subjects')} />
            <QuickAction label="Dashboard overview" desc="Quick stats and navigation" onClick={() => onNavigate('dashboard')} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Tips</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              Click <strong>View</strong> on any student row to see the full profile with attendance and marks.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              Use the search box in the top bar to filter any table instantly.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              Deleting a course removes its subjects automatically.
            </li>
          </ul>
        </div>
      </div>

      {stats.students === 0 && stats.courses === 0 && (
        <EmptyState
          title="Nothing here yet"
          message="Start by adding a course, then create subjects and students to see live data across the portal."
          action={
            <button
              onClick={() => onNavigate('courses')}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
            >
              Add your first course
            </button>
          }
        />
      )}
    </div>
  );
}

function QuickAction({ label, desc, onClick }: { label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
    >
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-500" />
    </button>
  );
}
