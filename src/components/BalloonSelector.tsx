import { useEffect, useMemo, useRef, useState } from "react";

type BalloonOption = {
  id: number;
  label: string;
};

type BalloonSelectorProps = {
  value: number;
  onChange: (id: number) => void;
  total?: number; // default 1000
};

export default function BalloonSelector({
  value,
  onChange,
  total = 1000,
}: BalloonSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Build the full list once
  const options: BalloonOption[] = useMemo(() => {
    return Array.from({ length: total }, (_, i) => ({
      id: i,
      label: `Balloon ${String(i).padStart(3, "0")}`,
    }));
  }, [total]);

  // Filter by search
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return options.filter((o) =>
      o.label.toLowerCase().includes(q)
    );
  }, [options, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const selected = options[value];

  return (
    <div ref={containerRef} className="relative w-64 text-sm">
      {/* ✅ Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-md border bg-white px-3 py-2 text-left shadow-sm hover:bg-gray-50"
      >
        {selected?.label ?? "Select Balloon"}
      </button>

      {/* ✅ Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          {/* Search Input */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full border-b px-3 py-2 outline-none"
          />

          {/* Results */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-gray-400">
                No results
              </div>
            )}

            {filtered.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`block w-full px-3 py-2 text-left hover:bg-blue-100 ${
                  value === opt.id ? "bg-blue-200" : ""
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
