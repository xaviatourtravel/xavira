"use client";

import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type SimpleRichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function exec(command: string) {
  document.execCommand(command, false);
}

export function SimpleRichTextEditor({
  value,
  onChange,
  placeholder = "Describe your product...",
  disabled = false,
  className,
}: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = editorRef.current;
    if (!node) return;
    if (node.innerHTML !== value) {
      node.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
        {[
          { icon: Bold, command: "bold", label: "Bold" },
          { icon: Italic, command: "italic", label: "Italic" },
          { icon: List, command: "insertUnorderedList", label: "Bullet list" },
          { icon: ListOrdered, command: "insertOrderedList", label: "Numbered list" },
        ].map(({ icon: Icon, command, label }) => (
          <button
            key={command}
            type="button"
            disabled={disabled}
            aria-label={label}
            onMouseDown={(event) => {
              event.preventDefault();
              exec(command);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
        className={cn(
          "min-h-[180px] px-3 py-3 text-sm leading-relaxed text-foreground outline-none",
          "empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />
    </div>
  );
}
