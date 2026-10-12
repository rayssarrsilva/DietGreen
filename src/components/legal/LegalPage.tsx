export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="flex-1 mx-auto max-w-2xl w-full px-6 py-12">
      <h1 className="font-display text-3xl mb-2">{title}</h1>
      <p className="text-sm text-ink-muted mb-8">Última atualização: {updated}</p>
      <div className="space-y-5 text-sm leading-relaxed [&_h2]:font-display [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </main>
  );
}
