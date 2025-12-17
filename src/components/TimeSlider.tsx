type TimeSliderProps = {
  windTimes: Date[];
  hourIndex: number;
  onChange: (index: number) => void;
};

export function TimeSlider({ windTimes, hourIndex, onChange }: TimeSliderProps) {
  if (windTimes.length === 0) return null;
  
  return (
    <div className="w-full rounded-lg border border-[#abc8cc]/30 bg-[#284846]/50 px-4 pt-3 pb-1">
      <div className="text-center text-sm mb-2">
        {windTimes[hourIndex].toLocaleString()}
      </div>
      <input
        type="range"
        min={0}
        max={windTimes.length - 1}
        value={hourIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
