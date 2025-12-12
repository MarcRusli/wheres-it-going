export function getStartEndTimes(timeSpan: number) {
  const now = new Date();

  // Round down to nearest hour
  const rounded = new Date(now);
  rounded.setMinutes(0, 0, 0);

  // timeSpan hours earlier
  const start = new Date(rounded.getTime() - timeSpan * 60 * 60 * 1000);

  return {
    end: rounded,
    start
  };
}
