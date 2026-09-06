import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { listCrspOptions } from "@/lib/calculator.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Field = "make" | "model" | "model_number";

interface Props {
  id: string;
  label: string;
  field: Field;
  recordType: "vehicle" | "motorcycle" | "machinery";
  make?: string | null;
  model?: string | null;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  disabledHint?: string;
}

/** Searchable dropdown fed live from the CRSP dataset — values are shown exactly as imported. */
export function CrspCombobox({
  id,
  label,
  field,
  recordType,
  make,
  model,
  value,
  onChange,
  disabled,
  placeholder,
  disabledHint,
}: Props) {
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setText(value), [value]);

  const run = useServerFn(listCrspOptions);
  const load = useMutation({
    mutationFn: (q: string) =>
      run({
        data: {
          recordType,
          field,
          query: q,
          make: make ?? null,
          model: model ?? null,
          limit: 50,
        },
      }),
  });

  const options = load.data?.options ?? [];

  useEffect(() => {
    if (!open || disabled) return;
    const t = setTimeout(() => load.mutate(text.trim()), 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, open, disabled, recordType, make, model]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (v: string) => {
    onChange(v);
    setText(v);
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        value={text}
        placeholder={disabled ? disabledHint : placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          setHighlight(0);
          setOpen(true);
          if (e.target.value === "") onChange("");
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.min(h + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && open && options[highlight]) {
            e.preventDefault();
            pick(options[highlight]!.value);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {load.isPending && options.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Loading…</p>
          )}
          {!load.isPending && options.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No matches in the CRSP schedule.</p>
          )}
          {options.map((o, i) => (
            <button
              type="button"
              key={o.value}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o.value)}
              className={`flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-sm ${
                i === highlight ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <span className="truncate">{o.value}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{o.record_count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
