/* import { useEffect, useMemo, useRef, useState } from "react";

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
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-md border bg-white px-3 py-2 text-left shadow-sm hover:bg-gray-50"
      >
        {selected?.label ?? "Select Balloon"}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full border-b px-3 py-2 outline-none"
          />

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
} */

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
    <div ref={containerRef} className="relative w-full text-sm">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-lg border border-[#abc8cc]/30 bg-[#284846]/50 px-4 py-3 text-left text-[#dae0d3] shadow-sm hover:bg-[#284846]/70 hover:border-[#abc8cc]/50 transition-all focus:outline-none focus:ring-2 focus:ring-[#abc8cc]/50 focus:border-[#abc8cc]"
      >
        {selected?.label ?? "Select Balloon"}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[9999] mt-2 w-full rounded-lg border border-[#abc8cc]/30 bg-[#284846] shadow-2xl">
          {/* Search Input */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search balloons..."
            className="w-full border-b border-[#abc8cc]/20 bg-transparent px-4 py-3 text-[#dae0d3] placeholder-[#dae0d3]/40 outline-none focus:border-[#abc8cc]/40"
          />

          {/* Results */}
          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#abc8cc]/30 scrollbar-track-[#284846]/50">
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-[#dae0d3]/40">
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
                className={`block w-full px-4 py-3 text-left transition-colors ${
                  value === opt.id
                    ? "bg-[#abc8cc]/25 text-[#abc8cc]"
                    : "text-[#dae0d3] hover:bg-[#abc8cc]/15 hover:text-[#abc8cc]"
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
