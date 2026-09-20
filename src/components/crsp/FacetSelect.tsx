import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { crspFilterOptions } from "@/lib/calculator.functions";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type FacetField =
  | "make"
  | "model"
  | "trim"
  | "fuel"
  | "transmission"
  | "drive"
  | "body"
  | "seating";

interface Props {
  field: FacetField;
  label: string;
  placeholder?: string;
  selected: string[];
  onChange: (values: string[]) => void;
  makes?: string[];
  models?: string[];
  trims?: string[];
  disabled?: boolean;
  disabledHint?: string;
}

export function FacetSelect({
  field,
  label,
  placeholder,
  selected,
  onChange,
  makes = [],
  models = [],
  trims = [],
  disabled,
  disabledHint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQuery(input), 180);
    return () => clearTimeout(t);
  }, [input]);

  const run = useServerFn(crspFilterOptions);
  const { data, isFetching } = useQuery({
    queryKey: ["crsp-facet", field, query, makes, models, trims],
    queryFn: () => run({ data: { field, query, makes, models, trims, limit: 60 } }),
    enabled: open && !disabled,
    staleTime: 60_000,
  });

  const options = data?.options ?? [];

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const summary =
    selected.length === 0
      ? (placeholder ?? `Any ${label.toLowerCase()}`)
      : selected.length === 1
        ? selected[0]!
        : `${selected.length} selected`;

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-label={label}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">{disabled ? (disabledHint ?? summary) : summary}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} value={input} onValueChange={setInput} />
            <CommandList>
              {isFetching && options.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">Loading…</div>
              ) : (
                <CommandEmpty>No matches in the CRSP data.</CommandEmpty>
              )}
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem key={o.value} value={o.value} onSelect={() => toggle(o.value)}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(o.value) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{o.value}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{o.record_count}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
