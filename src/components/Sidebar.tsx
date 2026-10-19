import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  X,
} from 'lucide-react';

export type View = 'dashboard' | 'students' | 'courses' | 'subjects';

type Props = {
  current: View;
  onNavigate: (v: View) => void;
  open: boolean;
  onClose: () => void;
};

const items: { id: View; label: string; icon: typeof Users }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
];

export default function Sidebar({ current, onNavigate, open, onClose }: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">EduAdmin</p>
            <p className="text-xs text-slate-500">College Portal</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {items.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={active ? 'text-brand-600' : 'text-slate-400'} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <ClipboardList size={16} />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-slate-700">Admin Office</p>
              <p className="text-[11px] text-slate-500">2026 Session</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
