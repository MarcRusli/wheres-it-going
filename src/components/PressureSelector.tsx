import { useState, useRef, useEffect } from "react";

const PRESSURE_LEVELS = [
  1000, 975, 950, 925, 900, 850, 800, 700, 600, 500,
  400, 300, 250, 200, 150, 100, 70, 50, 30,
];

const ALTITUDE_LABELS = [
  "110 m", "320 m", "500 m", "800 m", "1000 m",
  "1500 m", "1900 m", "3 km", "4.2 km", "5.6 km",
  "7.2 km", "9.2 km", "10.4 km", "11.8 km", "13.5 km",
  "15.8 km", "17.7 km", "19.3 km", "22 km",
];

const LEVELS = PRESSURE_LEVELS.map((p, i) => ({
  pressure: p,
  altitude: ALTITUDE_LABELS[i],
}));

type Props = {
  selected: number;
  onSelect: (level: number) => void;
};

export default function SearchablePressureDropdown({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = LEVELS.filter((lvl) =>
    lvl.pressure.toString().includes(query) ||
    lvl.altitude.toLowerCase().includes(query.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "260px" }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          cursor: "pointer",
          background: "#fff",
        }}
      >
        <strong>{selected} hPa</strong> —{" "}
        <span>{LEVELS.find((l) => l.pressure === selected)?.altitude}</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "105%",
            left: 0,
            width: "100%",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "6px",
            maxHeight: "240px",
            overflowY: "auto",
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {/* Search box */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pressure or altitude..."
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "none",
              borderBottom: "1px solid #eee",
              outline: "none",
            }}
          />

          {filtered.map((lvl) => (
            <div
              key={lvl.pressure}
              onClick={() => {
                onSelect(lvl.pressure);
                setOpen(false);
                setQuery("");
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                cursor: "pointer",
                background:
                  lvl.pressure === selected ? "#eef6ff" : "white",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <span>{lvl.pressure} hPa</span>
              <span style={{ opacity: 0.7 }}>{lvl.altitude}</span>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: "10px", color: "#777" }}>No matches</div>
          )}
        </div>
      )}
    </div>
  );
}
