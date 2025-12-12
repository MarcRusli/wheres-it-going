import { useEffect, useMemo, useRef, useState } from "react";

type PressureOption = {
  value: number;
  label: string;
  altitude?: string;
};

type SearchablePressureDropdownProps = {
  selected: number;
  onSelect: (pressure: number) => void;
};


const ALTITUDES = [
  "110 m",
  "320 m",
  "500 m",
  "800 m",
  "1000 m",
  "1500 m",
  "1900 m",
  "3 km",
  "4.2 km",
  "5.6 km",
  "7.2 km",
  "9.2 km",
  "10.4 km",
  "11.8 km",
  "13.5 km",
  "15.8 km",
  "17.7 km",
  "19.3 km",
  "22 km",
];

const PRESSURES = [
  1000, 975, 950, 925, 900, 850, 800, 700, 600, 500, 400, 300, 250, 200, 150,
  100, 70, 50, 30,
];

export default function SearchablePressureDropdown({
  selected,
  onSelect,
}: SearchablePressureDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Construct full list with altitude data
  const options: PressureOption[] = useMemo(() => {
    return PRESSURES.map((p, i) => ({
      value: p,
      label: `${p} hPa`,
      altitude: ALTITUDES[i] ?? undefined,
    }));
  }, []);

  // Filter by search
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.altitude && o.altitude.toLowerCase().includes(q))
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

  const selectedOption = options.find((o) => o.value === selected);

  return (
    <div ref={containerRef} className="relative w-full text-sm">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-lg border border-[#abc8cc]/30 bg-[#284846]/50 px-4 py-3 text-left text-[#dae0d3] shadow-sm hover:bg-[#284846]/70 hover:border-[#abc8cc]/50 transition-all"
      >
        {selectedOption
          ? `${selectedOption.label} — ${selectedOption.altitude}`
          : `${selected} hPa`}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[9999] mt-2 w-full rounded-lg border border-[#abc8cc]/30 bg-[#284846] shadow-2xl">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pressure or altitude..."
            className="w-full border-b border-[#abc8cc]/20 bg-transparent px-4 py-3 text-[#dae0d3] placeholder-[#dae0d3]/40 outline-none"
          />

          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-[#abc8cc]/30 scrollbar-track-[#284846]/50">
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-[#dae0d3]/40">No results</div>
            )}

            {filtered.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                  setQuery("");
                }}
                className={`flex justify-between items-center w-full px-4 py-3 text-left transition-colors ${
                  selected === opt.value
                    ? "bg-[#abc8cc]/25 text-[#abc8cc]"
                    : "text-[#dae0d3] hover:bg-[#abc8cc]/15 hover:text-[#abc8cc]"
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[#abc8cc]/70 text-xs">
                  {opt.altitude}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
