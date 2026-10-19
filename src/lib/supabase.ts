import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type Course = {
  id: string;
  course_code: string;
  name: string;
  department: string;
  duration_years: number;
  num_semesters: number;
  created_at?: string;
};

export type Subject = {
  id: string;
  subject_code: string;
  name: string;
  course_id: string | null;
  semester: number;
  credits: number;
  faculty: string | null;
  created_at?: string;
};

export type Attendance = {
  id: string;
  student_id: string;
  subject_id: string;
  attended: number;
  total: number;
};

export type Marks = {
  id: string;
  student_id: string;
  subject_id: string;
  internal_marks: number;
  assignment_marks: number;
  exam_marks: number;
};

export type Student = {
  id: string;
  student_id: string;
  enrollment_number: string;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  course_id: string | null;
  semester: number;
  section: string | null;
  photo_url: string | null;
  created_at?: string;
};

export type StudentWithCourse = Student & {
  course?: Pick<Course, 'id' | 'name' | 'course_code'> | null;
};

export type SubjectWithCourse = Subject & {
  course?: Pick<Course, 'id' | 'name' | 'course_code'> | null;
};
