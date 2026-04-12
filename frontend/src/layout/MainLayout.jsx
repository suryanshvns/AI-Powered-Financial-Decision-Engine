import { Outlet } from 'react-router-dom'
import Spinner from '../components/Spinner'
import TimeRangePills from '../components/TimeRangePills'
import { useAppState } from '../context/useAppState'

const SECTIONS = [
  { id: 'assistant', label: 'Overview' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'charts', label: 'Charts' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'lab', label: 'What-if' },
]

const MainLayout = () => {
  const {
    userIdInput,
    setUserIdInput,
    activeUserId,
    loading,
    loadDashboard,
    timeRangeDays,
    setTimeRangeDays,
  } = useAppState()

  const handleSubmit = e => {
    e.preventDefault()
    loadDashboard(userIdInput)
  }

  return (
    <div className="assist-app relative min-h-screen">
      <div className="assist-noise pointer-events-none fixed inset-0 z-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_100%,rgba(16,185,129,0.06),transparent)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-4 sm:px-6 lg:px-10 lg:pt-8">
        <header className="sticky top-0 z-50 -mx-4 mb-8 sm:-mx-6 lg:-mx-10">
          <div className="assist-hero-panel relative overflow-hidden border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-7 sm:py-6 lg:px-10 lg:py-7">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.45]"
              style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
              }}
              aria-hidden
            />
            <div className="relative flex min-w-0 flex-col gap-4 lg:gap-5">
              <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                <div className="flex min-w-0 shrink-0 items-center gap-4">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-600 text-xl font-extrabold text-white shadow-xl shadow-emerald-600/35 ring-2 ring-white">
                    ⌁
                    <span
                      className="absolute inset-0 rounded-2xl ring-2 ring-emerald-300/50 ring-offset-2 ring-offset-white/0"
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">FinSense</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Assistant
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:max-w-none">
                  {activeUserId ? (
                    <>
                      <div className="flex items-center gap-2 rounded-full border border-emerald-200/90 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-2 text-xs font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-500/10">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50 motion-reduce:animate-none" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span className="truncate font-mono font-bold">{activeUserId}</span>
                      </div>
                      <TimeRangePills value={timeRangeDays} onChange={setTimeRangeDays} disabled={loading} />
                    </>
                  ) : null}
                  <form
                    onSubmit={handleSubmit}
                    className="flex w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center lg:w-auto lg:flex-initial"
                  >
                    <input
                      type="text"
                      value={userIdInput}
                      onChange={e => setUserIdInput(e.target.value)}
                      autoComplete="off"
                      disabled={loading}
                      placeholder="User ID"
                      className="assist-input w-full min-w-0 sm:min-w-[160px] lg:w-48"
                    />
                    <button type="submit" disabled={loading} className="assist-btn-primary">
                      {loading ? (
                        <>
                          <Spinner className="h-4 w-4 text-white" />
                          Load
                        </>
                      ) : (
                        <>
                          Load workspace
                          <span aria-hidden>→</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {activeUserId ? (
                <nav
                  className="flex min-w-0 gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2 shadow-inner [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible"
                  aria-label="On-page sections"
                >
                  {SECTIONS.map(({ id, label }) => (
                    <a key={id} href={`#${id}`} className="assist-jump-pill shrink-0 whitespace-nowrap">
                      {label}
                    </a>
                  ))}
                </nav>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-h-[50vh]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
