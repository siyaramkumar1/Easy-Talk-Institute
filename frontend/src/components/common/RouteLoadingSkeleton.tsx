export default function RouteLoadingSkeleton() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50/50">
      <div className="w-12 h-12 rounded-full border-3 border-blue-600 border-t-transparent animate-spin mb-4" />
      <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}
