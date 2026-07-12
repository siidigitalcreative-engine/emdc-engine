"use client";

import React, { useEffect } from "react";

type Props = {
  name: string;
  size?: number;
  fill?: boolean;
  weight?: number;
  grade?: number;
  opticalSize?: number;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
};

const MATERIAL_SYMBOLS_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:FILL@0..1&display=swap";

export default function MaterialIcon({
  name,
  size = 20,
  fill = true,
  weight = 500,
  grade = 0,
  opticalSize = 24,
  style,
  className,
  title,
}: Props) {
  useEffect(() => {
    const id = "emdc-material-symbols-font";
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = MATERIAL_SYMBOLS_URL;
    document.head.appendChild(link);
  }, []);

  return (
    <span
      aria-hidden={title ? undefined : true}
      aria-label={title}
      title={title}
      className={`material-symbols-rounded${className ? ` ${className}` : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize: size,
        lineHeight: 1,
        color: "currentColor",
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
        userSelect: "none",
        ...style,
      }}
    >
      {name}
    </span>
  );t
}
