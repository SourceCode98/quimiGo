import { notFound } from 'next/navigation';
import { GRADES } from '@/content';
import { CourseView } from '@/components/CourseView';

export const dynamicParams = false;
export function generateStaticParams() { return GRADES.map((g) => ({ g: String(g.n) })); }
export async function generateMetadata({ params }: { params: Promise<{ g: string }> }) {
  const { g: n } = await params;
  const g = GRADES.find((x) => String(x.n) === n);
  return { title: g ? `${g.n}° · ${g.title} · QuimicaLearn` : 'QuimicaLearn' };
}
export default async function Page({ params }: { params: Promise<{ g: string }> }) {
  const n = Number((await params).g);
  if (!GRADES.some((g) => g.n === n)) notFound();
  return <CourseView n={n} />;
}
