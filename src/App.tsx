import { useState } from 'react';
import Sidebar, { type View } from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { ToastHost } from '@/components/Toast';
import Dashboard from '@/views/Dashboard';
import Students from '@/views/Students';
import Courses from '@/views/Courses';
import Subjects from '@/views/Subjects';
import StudentProfile from '@/views/StudentProfile';

type Page = { kind: 'view'; view: View } | { kind: 'profile'; studentId: string };

const titles: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your college administration' },
  students: { title: 'Students', subtitle: 'Browse and manage student records' },
  courses: { title: 'Courses', subtitle: 'Manage academic programs' },
  subjects: { title: 'Subjects', subtitle: 'Manage subjects across courses' },
};

function App() {
  const [page, setPage] = useState<Page>({ kind: 'view', view: 'dashboard' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isView = page.kind === 'view';
  const view = isView ? page.view : null;
  const meta = view ? titles[view] : { title: 'Student Profile', subtitle: 'Detailed academic information' };

  function navigate(v: View) {
    setPage({ kind: 'view', view: v });
    setSidebarOpen(false);
  }

  function viewStudent(id: string) {
    setPage({ kind: 'profile', studentId: id });
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        current={page.kind === 'view' ? page.view : 'students'}
        onNavigate={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={meta.title} subtitle={meta.subtitle} onMenu={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-x-hidden">
          {page.kind === 'view' && page.view === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {page.kind === 'view' && page.view === 'students' && <Students onView={viewStudent} />}
          {page.kind === 'view' && page.view === 'courses' && <Courses />}
          {page.kind === 'view' && page.view === 'subjects' && <Subjects />}
          {page.kind === 'profile' && (
            <StudentProfile studentId={page.studentId} onBack={() => navigate('students')} />
          )}
        </main>
      </div>

      <ToastHost />
    </div>
  );
}

export default App;
