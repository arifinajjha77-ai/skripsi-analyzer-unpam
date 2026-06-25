"use client";

/**
 * SmartCampus — UNPAM Cover Preview (Pixel-Perfect)
 *
 * Renders an A4-sized preview scaled to fit the container.
 * Uses the SAME `buildUnpamElements()` source of truth as the DOCX renderer,
 * guaranteeing that Preview ≡ DOCX.
 *
 * Approach: render a true 794×1123px (A4 at 96dpi) div, then scale it down
 * with CSS `transform: scale(containerWidth / 794)`. Every measurement is in
 * POINTS converted to pixels (pt × 96/72 = pt × 1.3333…).
 *
 * UNPAM margins at 96dpi:
 *   left  4cm = 151px
 *   right 3cm = 113px
 *   top   3cm = 113px
 *   bottom 3cm = 113px
 */

import { useRef, useState, useEffect } from "react";
import { CoverData } from "@/lib/cover/types";
import { getUniversityInfo } from "@/lib/cover/templates";
import { buildUnpamElements, UNPAM_FONT, UnpamElem } from "@/lib/cover/templates/unpam/makalahCover";

// ─── Constants ────────────────────────────────────────────────────────────────

/** A4 at 96 dpi */
const A4_W = 794;
const A4_H = 1123;

/** points → pixels at 96dpi */
const PT = (pt: number) => pt * (96 / 72);

/** cm → pixels at 96dpi */
const CM = (cm: number) => (cm * 96) / 2.54;

// UNPAM margins
const M_TOP    = Math.round(CM(3));   // 113px
const M_BOTTOM = Math.round(CM(3));   // 113px
const M_LEFT   = Math.round(CM(4));   // 151px
const M_RIGHT  = Math.round(CM(3));   // 113px

const CONTENT_W = A4_W - M_LEFT - M_RIGHT;   // 530px
const CONTENT_H = A4_H - M_TOP  - M_BOTTOM;  // 897px

// Logo size: 3cm (UNPAM_FONT.logoSizePt ≈ 85pt → 113px at 96dpi)
const LOGO_PX = Math.round(PT(UNPAM_FONT.logoSizePt));

// ─── Single Element Renderer ──────────────────────────────────────────────────

function renderElem(el: UnpamElem, idx: number, logoSrc: string | undefined): React.ReactNode {
  const mb = PT(el.afterPt); // marginBottom in px

  if (el.type === "spacer") {
    return <div key={idx} style={{ height: mb, flexShrink: 0 }} />;
  }

  if (el.type === "logo") {
    return (
      <div key={idx} style={{ marginBottom: mb, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="Logo Universitas"
            style={{ width: LOGO_PX, height: LOGO_PX, objectFit: "contain", display: "block" }}
          />
        ) : (
          <div style={{
            width: LOGO_PX, height: LOGO_PX,
            border: "1.5px dashed #ccc",
            borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "#bbb",
          }}>
            Logo
          </div>
        )}
      </div>
    );
  }

  // type === "text"
  return (
    <div
      key={idx}
      style={{
        fontSize:     PT(el.sizePt),
        fontWeight:   el.bold ? "bold" : "normal",
        lineHeight:   1.25,
        textAlign:    "center",
        marginBottom: mb,
        flexShrink:   0,
        wordBreak:    "break-word",
        width:        "100%",
      }}
    >
      {el.text}
    </div>
  );
}

// ─── Main Preview Component ───────────────────────────────────────────────────

interface UnpamCoverPreviewProps {
  cover: CoverData;
}

export default function UnpamCoverPreview({ cover }: UnpamCoverPreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  // Dynamically scale to fill container width
  useEffect(() => {
    function recalc() {
      if (wrapRef.current) {
        setScale(wrapRef.current.offsetWidth / A4_W);
      }
    }
    recalc();
    const obs = new ResizeObserver(recalc);
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  const uniInfo = getUniversityInfo(cover.universityId);
  const logoSrc = cover.logoUrl ?? uniInfo?.logoPath;
  const elements = buildUnpamElements(cover);

  return (
    <div>
      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#94a3b8",
          marginBottom: 8,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Live Preview Cover — UNPAM
      </p>

      {/* Outer wrapper: sets the aspect ratio and acts as the scaling container */}
      <div
        ref={wrapRef}
        style={{
          width: "100%",
          aspectRatio: `${A4_W} / ${A4_H}`,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* True A4 at 96dpi, scaled down */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: A4_W,
            height: A4_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            fontFamily: "'Times New Roman', Times, serif",
            background: "white",
            color: "#000",
          }}
        >
          {/* Content area: UNPAM margins */}
          <div
            style={{
              position: "absolute",
              top:    M_TOP,
              left:   M_LEFT,
              width:  CONTENT_W,
              height: CONTENT_H,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {elements.map((el, idx) => renderElem(el, idx, logoSrc))}
          </div>
        </div>
      </div>
    </div>
  );
}
