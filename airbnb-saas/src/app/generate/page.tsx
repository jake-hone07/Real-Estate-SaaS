// src/app/generate/page.tsx
import { requireSession } from '@/lib/require-session';
import GenerateClient from './GenerateClient';

export default async function GeneratePage() {
  await requireSession();
  return (
    <div className="mx-auto max-w-6xl p-6">
      <GenerateClient />
    </div>
  );
}
