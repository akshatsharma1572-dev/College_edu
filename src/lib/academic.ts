export function gradeFromPercentage(pct: number): { grade: string; color: string } {
  if (pct >= 90) return { grade: 'A+', color: 'text-success-700 bg-success-50' };
  if (pct >= 80) return { grade: 'A', color: 'text-success-700 bg-success-50' };
  if (pct >= 70) return { grade: 'B+', color: 'text-brand-700 bg-brand-50' };
  if (pct >= 60) return { grade: 'B', color: 'text-brand-700 bg-brand-50' };
  if (pct >= 50) return { grade: 'C', color: 'text-warning-700 bg-warning-50' };
  if (pct >= 40) return { grade: 'D', color: 'text-warning-700 bg-warning-50' };
  return { grade: 'F', color: 'text-error-700 bg-error-50' };
}

export function attendanceColor(pct: number): string {
  if (pct >= 75) return 'text-success-700 bg-success-50';
  if (pct >= 60) return 'text-warning-700 bg-warning-50';
  return 'text-error-700 bg-error-50';
}

export function formatDate(d: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return d;
  }
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
