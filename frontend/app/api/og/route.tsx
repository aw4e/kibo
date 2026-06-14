import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const streak  = searchParams.get("streak")  ?? "0";
  const address = searchParams.get("address") ?? "";
  const saved   = searchParams.get("saved")   ?? "0";

  const daysToMilestone = 7 - (parseInt(streak) % 7) || 7;
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#F7F5FF",
          backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent stripe */}
        <div style={{ display: "flex", height: 10 }}>
          <div style={{ flex: 1, background: "#7C3AED" }} />
          <div style={{ flex: 1, background: "#FFE500" }} />
          <div style={{ flex: 1, background: "#22C55E" }} />
          <div style={{ flex: 1, background: "#3B82F6" }} />
        </div>

        {/* Big K watermark */}
        <div style={{
          position: "absolute", right: -20, top: -30,
          fontSize: 480, color: "rgba(124,58,237,0.05)",
          fontWeight: 700, lineHeight: 1,
        }}>K</div>

        {/* Main content */}
        <div style={{
          display: "flex", flex: 1, padding: "48px 60px",
          flexDirection: "column", justifyContent: "space-between",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              background: "#7C3AED", borderRadius: 16,
              border: "3px solid #09090B",
              boxShadow: "3px 3px 0 #09090B",
              width: 56, height: 56,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ color: "#FFE500", fontSize: 28, fontWeight: 900 }}>K</div>
            </div>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#09090B", letterSpacing: "-0.02em" }}>
              Kibo
            </span>
            <div style={{
              marginLeft: "auto", display: "flex", alignItems: "center", gap: 8,
              background: "#DCFCE7", border: "2px solid #09090B",
              boxShadow: "2px 2px 0 #09090B", borderRadius: 9999,
              padding: "6px 14px",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
              <span style={{ fontSize: 14, fontWeight: 900, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Live · Celo
              </span>
            </div>
          </div>

          {/* Streak hero */}
          <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
            {/* Big number */}
            <div style={{
              background: "linear-gradient(135deg, #6D28D9, #1D4ED8)",
              border: "4px solid #09090B",
              boxShadow: "8px 8px 0 #09090B",
              borderRadius: 32,
              padding: "28px 48px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                🔥 streak
              </span>
              <span style={{ fontSize: 96, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.04em" }}>
                {streak}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>days</span>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <p style={{ fontSize: 18, color: "rgba(9,9,11,0.4)", fontWeight: 600, margin: 0 }}>Total saved</p>
                <p style={{ fontSize: 40, fontWeight: 900, color: "#7C3AED", margin: 0, letterSpacing: "-0.03em" }}>
                  {saved} cUSD
                </p>
              </div>
              <div>
                <p style={{ fontSize: 18, color: "rgba(9,9,11,0.4)", fontWeight: 600, margin: 0 }}>Next milestone</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: "#09090B", margin: 0, letterSpacing: "-0.02em" }}>
                  {daysToMilestone} day{daysToMilestone !== 1 ? "s" : ""} away
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 20, fontWeight: 600, color: "rgba(9,9,11,0.4)", margin: 0 }}>
              Daily savings on Celo · Earn every 7 days
            </p>
            {short && (
              <div style={{
                background: "#09090B", borderRadius: 12,
                padding: "8px 16px",
              }}>
                <span style={{ fontFamily: "monospace", fontSize: 16, color: "#fff", fontWeight: 700 }}>
                  {short}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
