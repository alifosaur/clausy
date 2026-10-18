import type { NextConfig } from "next";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

// Next.js App Router requires 'unsafe-inline' for inline hydration and bootstrap scripts when using static header CSP.
// connect-src is strictly limited to 'self' and NEXT_PUBLIC_API_URL.
// img-src includes blob: for user uploaded page preview thumbnails and data: for inline assets.
const connectSources = ["'self'"];
if (apiUrl && !connectSources.includes(apiUrl)) {
  connectSources.push(apiUrl);
}

const isDev = process.env.NODE_ENV === "development";
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
  : "script-src 'self' 'unsafe-inline';";

const cspHeader = `
  default-src 'self';
  ${scriptSrc}
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  media-src 'self' blob: data:;
  font-src 'self' data:;
  connect-src ${connectSources.join(" ")};
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), browsing-topics=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
