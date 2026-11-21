import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kradl — On-Chain App & Project Launchpad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#09090B",
          color: "#FAFAFA",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          border: "1px solid #232329",
        }}
      >
        {/* Top brand row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: "#111114",
                border: "1.5px solid #27272A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 700,
                color: "#FAFAFA",
              }}
            >
              K
            </div>
            <span style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Kradl
            </span>
          </div>
          <div
            style={{
              fontSize: "18px",
              color: "#A1A1AA",
              border: "1px solid #27272A",
              borderRadius: "8px",
              padding: "8px 16px",
              backgroundColor: "#111114",
            }}
          >
            kradl.xyz
          </div>
        </div>

        {/* Center headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "920px" }}>
          <div
            style={{
              fontSize: "68px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#FAFAFA",
            }}
          >
            Fund real apps from block one.
          </div>
          <div style={{ fontSize: "26px", color: "#A1A1AA", lineHeight: 1.45 }}>
            Fair-launch bonding curves on Robinhood Chain &amp; Base. Every buy and sell streams
            0.5% ETH directly to the builder.
          </div>
        </div>

        {/* Bottom protocol spec strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "36px",
            borderTop: "1px solid #232329",
            paddingTop: "28px",
            fontSize: "20px",
            color: "#A1A1AA",
          }}
        >
          <span>
            Supply <strong style={{ color: "#FAFAFA" }}>1B Fixed</strong>
          </span>
          <span>
            Builder Fee <strong style={{ color: "#10B981" }}>0.5% ETH</strong>
          </span>
          <span>
            Liquidity <strong style={{ color: "#FAFAFA" }}>Auto DEX Lock</strong>
          </span>
          <span>
            Security <strong style={{ color: "#FAFAFA" }}>Trust &amp; Safety Scan</strong>
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
