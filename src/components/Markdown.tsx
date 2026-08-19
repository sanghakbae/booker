"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

export function Markdown({ content }: { content: string }) {
  return (
    <div className="doc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeHighlight]}
        components={{
          // Wrap tables so a wide one scrolls inside its own box instead of
          // pushing the page sideways.
          table: ({ children }) => (
            <div className="table-scroll">
              <table>{children}</table>
            </div>
          ),
          a: ({ href, children }) => {
            const external = !!href && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer noopener" : undefined}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
