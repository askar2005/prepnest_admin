export function DashboardPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Admin dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Manage PrepNest content with clarity.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Organize categories, notes, questions, and tests from a clean operational workspace.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Total users</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">0</div>
        </div>
        <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Categories</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">0</div>
        </div>
        <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="text-sm text-slate-500">Mock tests</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">0</div>
        </div>
      </section>
    </div>
  );
}
