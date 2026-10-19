/*
# College Administration Schema

Single-tenant app (no sign-in). All data is intentionally shared/public,
so policies use `TO anon, authenticated` with `USING (true)`.

## Tables

1. `courses`
   - id (uuid pk)
   - course_code (text, unique) - e.g. "BTECH-CS"
   - name (text) - Course Name
   - department (text)
   - duration_years (int) - Duration in years
   - num_semesters (int) - Number of semesters
   - created_at (timestamptz)

2. `subjects`
   - id (uuid pk)
   - subject_code (text, unique)
   - name (text) - Subject Name
   - course_id (uuid FK -> courses.id ON DELETE CASCADE)
   - semester (int)
   - credits (int)
   - faculty (text)
   - created_at (timestamptz)

3. `students`
   - id (uuid pk)
   - student_id (text, unique) - display id e.g. "STU001"
   - enrollment_number (text, unique)
   - name (text)
   - email (text)
   - phone (text)
   - dob (date)
   - gender (text)
   - address (text)
   - course_id (uuid FK -> courses.id ON DELETE SET NULL)
   - semester (int)
   - section (text)
   - photo_url (text, nullable)
   - created_at (timestamptz)

4. `student_attendance`
   - id (uuid pk)
   - student_id (uuid FK -> students.id ON DELETE CASCADE)
   - subject_id (uuid FK -> subjects.id ON DELETE CASCADE)
   - attended (int) - classes attended
   - total (int) - total classes conducted
   - UNIQUE(student_id, subject_id)

5. `student_marks`
   - id (uuid pk)
   - student_id (uuid FK -> students.id ON DELETE CASCADE)
   - subject_id (uuid FK -> subjects.id ON DELETE CASCADE)
   - internal_marks (int) - out of 100
   - assignment_marks (int) - out of 100
   - exam_marks (int) - out of 100
   - UNIQUE(student_id, subject_id)

## Security
- RLS enabled on all tables.
- Anon + authenticated can perform full CRUD (shared public data).
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text UNIQUE NOT NULL,
  name text NOT NULL,
  department text NOT NULL,
  duration_years int NOT NULL DEFAULT 4,
  num_semesters int NOT NULL DEFAULT 8,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code text UNIQUE NOT NULL,
  name text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  semester int NOT NULL,
  credits int NOT NULL DEFAULT 4,
  faculty text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  enrollment_number text UNIQUE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  dob date,
  gender text,
  address text,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  semester int NOT NULL DEFAULT 1,
  section text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  attended int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  UNIQUE(student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS student_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  internal_marks int NOT NULL DEFAULT 0,
  assignment_marks int NOT NULL DEFAULT 0,
  exam_marks int NOT NULL DEFAULT 0,
  UNIQUE(student_id, subject_id)
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_marks ENABLE ROW LEVEL SECURITY;

-- courses policies
DROP POLICY IF EXISTS "courses_select" ON courses;
CREATE POLICY "courses_select" ON courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "courses_insert" ON courses;
CREATE POLICY "courses_insert" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "courses_update" ON courses;
CREATE POLICY "courses_update" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "courses_delete" ON courses;
CREATE POLICY "courses_delete" ON courses FOR DELETE TO anon, authenticated USING (true);

-- subjects policies
DROP POLICY IF EXISTS "subjects_select" ON subjects;
CREATE POLICY "subjects_select" ON subjects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "subjects_insert" ON subjects;
CREATE POLICY "subjects_insert" ON subjects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "subjects_update" ON subjects;
CREATE POLICY "subjects_update" ON subjects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "subjects_delete" ON subjects;
CREATE POLICY "subjects_delete" ON subjects FOR DELETE TO anon, authenticated USING (true);

-- students policies
DROP POLICY IF EXISTS "students_select" ON students;
CREATE POLICY "students_select" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "students_insert" ON students;
CREATE POLICY "students_insert" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "students_update" ON students;
CREATE POLICY "students_update" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "students_delete" ON students;
CREATE POLICY "students_delete" ON students FOR DELETE TO anon, authenticated USING (true);

-- student_attendance policies
DROP POLICY IF EXISTS "attendance_select" ON student_attendance;
CREATE POLICY "attendance_select" ON student_attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "attendance_insert" ON student_attendance;
CREATE POLICY "attendance_insert" ON student_attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "attendance_update" ON student_attendance;
CREATE POLICY "attendance_update" ON student_attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "attendance_delete" ON student_attendance;
CREATE POLICY "attendance_delete" ON student_attendance FOR DELETE TO anon, authenticated USING (true);

-- student_marks policies
DROP POLICY IF EXISTS "marks_select" ON student_marks;
CREATE POLICY "marks_select" ON student_marks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "marks_insert" ON student_marks;
CREATE POLICY "marks_insert" ON student_marks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "marks_update" ON student_marks;
CREATE POLICY "marks_update" ON student_marks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "marks_delete" ON student_marks;
CREATE POLICY "marks_delete" ON student_marks FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_subjects_course ON subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON student_marks(student_id);
