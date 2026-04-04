import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="40" height="40" rx="12" className="fill-emerald-500/15" />
      <path
        d="M12 26c0-6 4-10 10-10h2v4h-2c-3.5 0-6 2.5-6 6v4h-4v-4Z"
        className="fill-emerald-400"
      />
      <path
        d="M22 14c6 0 10 4 10 10h-4c0-3.5-2.5-6-6-6h-2v-4h2Z"
        className="fill-emerald-300"
      />
    </svg>
  )
}

function FeatureCard({
  id,
  icon,
  title,
  description,
}: {
  id?: string
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <article
      id={id}
      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-emerald-500/30 hover:bg-white/[0.06]"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 transition group-hover:bg-emerald-500/15">
        {icon}
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
    </article>
  )
}

export function HomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-dvh overflow-hidden bg-surface-950 font-sans text-slate-300">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.25),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-teal-600/10 blur-3xl"
        aria-hidden
      />

      <header className="relative z-10 border-b border-white/5 bg-surface-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a
            href="#top"
            className="flex min-h-[44px] min-w-[44px] items-center gap-3 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            <LogoMark className="h-10 w-10 shrink-0" />
            <span className="text-left">
              <span className="block text-base font-semibold tracking-tight text-white">
                Fluxo Bank
              </span>
              <span className="text-xs text-slate-500">Pix · conta · extrato</span>
            </span>
          </a>

          <nav
            className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex"
            aria-label="Principal"
          >
            <a
              href="#vantagens"
              className="rounded-lg px-2 py-2 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              Vantagens
            </a>
            <a
              href="#seguranca"
              className="rounded-lg px-2 py-2 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              Segurança
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="min-h-[44px] rounded-xl px-4 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              onClick={() => navigate('/entrar')}
            >
              Entrar
            </button>
            <button
              type="button"
              className="min-h-[44px] rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-surface-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              onClick={() => navigate('/abrir-conta')}
            >
              Abrir conta
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Conta digital pensada para o seu ritmo
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
            Seu dinheiro em fluxo,{' '}
            <span className="bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
              sem complicação
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Pix na hora, extrato claro e camadas de segurança inspiradas em neobanks —
            tudo numa experiência limpa, rápida e pronta para escalar.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className="inline-flex min-h-[48px] min-w-[min(100%,200px)] items-center justify-center rounded-xl bg-emerald-500 px-8 text-base font-semibold text-surface-950 shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Começar agora
            </button>
            <button
              type="button"
              className="inline-flex min-h-[48px] min-w-[min(100%,200px)] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 text-base font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Ver como funciona
            </button>
          </div>

          <dl className="mt-16 grid gap-8 border-t border-white/10 pt-12 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Pix
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">
                Instantâneo
              </dd>
              <dd className="mt-1 text-sm text-slate-500">24h, todos os dias</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Extrato
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-white">Em tempo real</dd>
              <dd className="mt-1 text-sm text-slate-500">Histórico organizado</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Segurança
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-white">Em camadas</dd>
              <dd className="mt-1 text-sm text-slate-500">Boas práticas de mercado</dd>
            </div>
          </dl>
        </section>

        <section
          id="vantagens"
          className="border-t border-white/5 bg-surface-900/50 py-20"
          aria-labelledby="vantagens-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              id="vantagens-heading"
              className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
            >
              O essencial para o dia a dia
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Menos fricção nas transferências e mais clareza no que importa — alinhado à
              visão do Fluxo Bank no portfólio.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                title="Pix sem enrolação"
                description="Envie e receba com feedback claro de status. Fila assíncrona no backend quando a carga crescer."
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5 10.5 6.75l4.5 4.5 6-6M3.75 6.75h4.5v4.5"
                    />
                  </svg>
                }
              />
              <FeatureCard
                title="Extrato que respira"
                description="Lista paginada, cache no cliente com React Query e estados de carregamento honestos."
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-3 3m3-3 3 3"
                    />
                  </svg>
                }
              />
              <FeatureCard
                id="seguranca"
                title="Segurança invisível"
                description="JWT com boas práticas, limites e auditoria — a camada certa no momento certo."
                icon={
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.313-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-surface-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <div>
              <p className="text-sm font-medium text-white">Fluxo Bank</p>
              <p className="text-xs text-slate-500">Demonstração de portfólio · 2026</p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Este é um projeto de estudo. Não é instituição financeira.
          </p>
        </div>
      </footer>
    </div>
  )
}
