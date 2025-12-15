export type ApiError = {
  message: string;
  source: "open-meteo" | "windborne" | "network";
  status?: number;
};

export function OpenMeteoStatusBanner({ error }: { error: ApiError | null }) {
  if (!error) return null;

  return (
    <div
      style={{
        padding: "12px 16px",
        background: "#fdecea",
        border: "1px solid #f5c2c0",
        borderRadius: "8px",
        color: "#7a1c1c",
        marginBottom: "12px",
      }}
    >
      <strong>Open-Meteo wind data unavailable</strong>
      <div style={{ marginTop: 6 }}>{error.message}</div>
    </div>
  );
}
