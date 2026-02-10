export function StagingBanner() {
  if (process.env.NEXT_PUBLIC_APP_ENV !== "staging") return null;

  return (
    <div className="bg-amber-500 text-black text-center text-xs font-semibold py-1 z-50 sticky top-0">
      STAGING ENVIRONMENT &mdash; Data here is not production
    </div>
  );
}
