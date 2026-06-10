import { redirect } from 'next/navigation';

// Rein serverseitiger Fallback ohne UI-Ballast
export default function GlobalNotFound() {
  redirect('/de');
}
