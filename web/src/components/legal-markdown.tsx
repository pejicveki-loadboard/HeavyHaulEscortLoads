import Link from "next/link";

// Deliberately minimal -- these two legal pages are the only markdown
// content in the app, so a full markdown library would be a lot of surface
// area for four constructs: headings, bold, links, and unordered lists.

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      const href = match[2];
      const key = `${keyPrefix}-${i}`;
      nodes.push(
        href.startsWith("/") ? (
          <Link key={key} href={href} className="text-brand-accent underline">
            {match[1]}
          </Link>
        ) : (
          <a key={key} href={href} className="text-brand-accent underline">
            {match[1]}
          </a>
        )
      );
    } else if (match[3] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-${i}`} className="text-brand-text">
          {match[3]}
        </strong>
      );
    }
    lastIndex = pattern.lastIndex;
    i++;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function LegalMarkdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="flex flex-col gap-1 pl-6 text-brand-text list-disc">
        {listBuffer.map((item, idx) => (
          <li key={idx}>{renderInline(item, `li-${blocks.length}-${idx}`)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;

    if (line.startsWith("# ")) {
      flushList();
      blocks.push(
        <h1 key={i} className="text-3xl font-semibold text-brand-text">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={i} className="mt-4 text-xl font-semibold text-brand-text">
          {renderInline(line.slice(3), `h2-${i}`)}
        </h2>
      );
    } else if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
    } else if (line.trim() === "---") {
      flushList();
      blocks.push(<hr key={i} className="border-brand-border" />);
    } else if (line.startsWith("*") && !line.startsWith("**") && line.endsWith("*")) {
      flushList();
      blocks.push(
        <p key={i} className="text-sm italic text-brand-muted">
          {renderInline(line.slice(1, -1), `it-${i}`)}
        </p>
      );
    } else {
      flushList();
      blocks.push(
        <p key={i} className="text-brand-text">
          {renderInline(line, `p-${i}`)}
        </p>
      );
    }
  }
  flushList();

  return <div className="flex flex-col gap-3">{blocks}</div>;
}
