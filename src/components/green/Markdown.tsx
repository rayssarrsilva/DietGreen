import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children: c }) => <p className="mb-2 last:mb-0 leading-relaxed">{c}</p>,
        ul: ({ children: c }) => <ul className="mb-2 list-disc pl-5 space-y-1">{c}</ul>,
        ol: ({ children: c }) => <ol className="mb-2 list-decimal pl-5 space-y-1">{c}</ol>,
        strong: ({ children: c }) => <strong className="font-semibold">{c}</strong>,
        a: ({ children: c, href }) => (
          <a href={href} className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer">
            {c}
          </a>
        ),
        table: ({ children: c }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full text-xs border-collapse">{c}</table>
          </div>
        ),
        th: ({ children: c }) => <th className="border border-border px-2 py-1 text-left font-semibold bg-surface-2">{c}</th>,
        td: ({ children: c }) => <td className="border border-border px-2 py-1 align-top">{c}</td>,
        h1: ({ children: c }) => <p className="font-semibold mb-1">{c}</p>,
        h2: ({ children: c }) => <p className="font-semibold mb-1">{c}</p>,
        h3: ({ children: c }) => <p className="font-semibold mb-1">{c}</p>,
        code: ({ children: c }) => <code className="rounded bg-surface-2 px-1 text-[0.85em]">{c}</code>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
