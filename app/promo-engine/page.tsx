"use client";

import React from "react";
import AppTopBar from "@/components/AppTopBar";

export default function PromoEnginePage() {
  return (
    <>
      <AppTopBar />

      <style>{`
        html,
        body {
          margin: 0;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          background: #F8F9FA;
        }

        .emdc-promo-engine-page {
          width: 100%;
          min-height: calc(100dvh - 96px);
          background: #F8F9FA;
        }

        .emdc-promo-engine-frame {
          display: block;
          width: 100%;
          height: calc(100dvh - 96px);
          min-height: 720px;
          border: 0;
          background: #F3F2EE;
        }

        @media (max-width: 759px) {
          .emdc-promo-engine-page {
            min-height: calc(100dvh - 52px);
          }

          .emdc-promo-engine-frame {
            height: calc(100dvh - 52px);
            min-height: 680px;
          }
        }
      `}</style>

      <main className="emdc-promo-engine-page">
        <iframe
          className="emdc-promo-engine-frame"
          src="/promo-engine.html"
          title="Sunbeams Promo Engine"
          loading="eager"
          allowFullScreen
        />
      </main>
    </>
  );
}
