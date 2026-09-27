import { notFound } from 'next/navigation';
import { ALL_UNITS, UNIT_BY_ID } from '@/content/units';
import { UNIT_GAMES } from '@/content/games';
import { RetoView } from '@/components/RetoView';

export const dynamicParams = false;
export function generateStaticParams() { return ALL_UNITS.filter((u) => UNIT_GAMES[u.id]).map((u) => ({ unit: u.id })); }
export async function generateMetadata({ params }: { params: Promise<{ unit: string }> }) {
  const { unit } = await params;
  const g = UNIT_GAMES[unit];
  return { title: g ? `Reto: ${g.title} · QuimicaLearn` : 'QuimicaLearn' };
}
export default async function Page({ params }: { params: Promise<{ unit: string }> }) {
  const { unit } = await params;
  if (!UNIT_BY_ID[unit] || !UNIT_GAMES[unit]) notFound();
  return <RetoView unitId={unit} />;
}
