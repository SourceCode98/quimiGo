import { notFound } from 'next/navigation';
import { ALL_LESSONS, LESSON_BY_ID } from '@/content';
import { LessonView } from '@/components/LessonView';

export const dynamicParams = false;
export function generateStaticParams() { return ALL_LESSONS.map((l) => ({ id: l.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const l = LESSON_BY_ID[(await params).id];
  return { title: l ? `${l.title} · ${l.grade.n}° · QuimicaLearn` : 'QuimicaLearn' };
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!LESSON_BY_ID[id]) notFound();
  return <LessonView id={id} />;
}
