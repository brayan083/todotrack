import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-border bg-muted">
          <span className="text-xl font-semibold text-muted-foreground">404</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">No hay nada aqui</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La pagina que buscas no existe o fue movida.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Ir al inicio
          </Link>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
