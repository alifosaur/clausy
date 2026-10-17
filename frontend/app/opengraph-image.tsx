import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Clausy — AI Rental Agreement Reader";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#FAF8F5",
          padding: "80px",
          fontFamily: "serif",
          border: "16px solid #E8E5DF",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: 20,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#73726C",
                fontFamily: "monospace",
              }}
            >
              Rental Agreement Reader
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: -8,
                right: -8,
                height: 38,
                backgroundColor: "#FFE600",
                opacity: 0.85,
              }}
            />
            <div
              style={{
                fontSize: 96,
                fontWeight: 700,
                color: "#141413",
                letterSpacing: "-0.04em",
                position: "relative",
              }}
            >
              Clausy
            </div>
          </div>

          <div
            style={{
              fontSize: 36,
              color: "#383733",
              maxWidth: 900,
              lineHeight: 1.3,
              marginTop: 10,
              fontFamily: "sans-serif",
            }}
          >
            Know what you&apos;re signing. Clausy shows the exact clause behind every answer.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "2px solid #E8E5DF",
            paddingTop: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "24px",
              fontFamily: "monospace",
              fontSize: 18,
              color: "#73726C",
            }}
          >
            <span>✓ Verbatim Quotes</span>
            <span>✓ Code Calculation</span>
            <span>✓ Zero Hallucinations</span>
          </div>

          <div
            style={{
              display: "flex",
              backgroundColor: "#141413",
              color: "#FAF8F5",
              padding: "10px 24px",
              borderRadius: 12,
              fontSize: 18,
              fontWeight: 600,
              fontFamily: "sans-serif",
            }}
          >
            Track 1 · Gemma 4
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
