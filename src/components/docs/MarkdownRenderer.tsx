import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { Link } from 'react-router-dom';

export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeSlug]}
    components={{
      h1: ({ children }) => <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-4">{children}</h1>,
      h2: ({ children, id }) => <h2 id={id} className="text-xl font-bold text-gray-900 mt-10 mb-3 pb-2 border-b border-gray-200 scroll-mt-24">{children}</h2>,
      h3: ({ children, id }) => <h3 id={id} className="text-base font-semibold text-gray-900 mt-7 mb-2 scroll-mt-24">{children}</h3>,
      h4: ({ children }) => <h4 className="text-sm font-semibold text-gray-800 mt-5 mb-1.5">{children}</h4>,
      p: ({ children }) => <p className="text-sm leading-7 text-gray-700 my-3">{children}</p>,
      ul: ({ children }) => <ul className="list-disc pl-6 my-3 space-y-1.5 text-sm text-gray-700 leading-7">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal pl-6 my-3 space-y-1.5 text-sm text-gray-700 leading-7">{children}</ol>,
      li: ({ children }) => <li className="pl-1">{children}</li>,
      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
      hr: () => <hr className="my-8 border-gray-200" />,
      blockquote: ({ children }) => (
        <blockquote className="my-4 rounded-xl border border-primary-200 bg-primary-50/60 px-4 py-2 text-sm text-primary-900 [&_p]:my-1.5 [&_ul]:my-1.5">
          {children}
        </blockquote>
      ),
      a: ({ href = '', children }) =>
        href.startsWith('/') ? (
          <Link to={href} className="text-primary-700 underline underline-offset-2 hover:text-primary-800">{children}</Link>
        ) : (
          <a
            href={href}
            target={href.startsWith('#') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="text-primary-700 underline underline-offset-2 hover:text-primary-800"
          >
            {children}
          </a>
        ),
      table: ({ children }) => (
        <div className="my-5 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm text-left">{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">{children}</thead>,
      th: ({ children }) => <th className="px-3 py-2 font-semibold border-b border-gray-200 whitespace-nowrap">{children}</th>,
      td: ({ children }) => <td className="px-3 py-2 align-top text-gray-700 border-b border-gray-100">{children}</td>,
      pre: ({ children }) => <pre className="my-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs leading-6 text-slate-100">{children}</pre>,
      code: ({ children, className }) =>
        className ? (
          <code className={className}>{children}</code>
        ) : (
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.8rem] font-mono text-gray-800">{children}</code>
        ),
    }}
  >
    {content}
  </ReactMarkdown>
);
