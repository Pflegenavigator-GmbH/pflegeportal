// src/app/[locale]/pflegegrad/loading.tsx
// Suspense-Fallback für den Pflegegrad-Workflow — ersetzt den bisherigen
// "hasMounted ? … : null"-Blank-Screen beim Navigieren zwischen Modulen.

export default function PflegegradLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
      <div className="w-10 h-10 border-4 border-white/10 border-t-[#20b2aa] rounded-full animate-spin" />
      <p className="mt-4 text-sm text-gray-400">Modul wird geladen…</p>
    </div>
  );
}
