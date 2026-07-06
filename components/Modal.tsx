"use client";

import React from "react";

export type ModalProps = {
  open?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
};

export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(15,23,42,.48)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 10px calc(88px + env(safe-area-inset-bottom))"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "min(78dvh, 720px)",
          background: "#fff",
          borderRadius: "22px 22px 18px 18px",
          overflow: "auto",
          padding: 20
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
