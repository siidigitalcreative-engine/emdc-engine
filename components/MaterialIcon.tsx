"use client";

import React from "react";

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

const PATHS: Record<string, React.ReactNode> = {
  notifications: (
    <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6v-5a7 7 0 0 0-5.5-6.84V3a1.5 1.5 0 0 0-3 0v1.16A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
  ),
  view_stream: (
    <path d="M4 5h16v5H4V5Zm0 9h16v5H4v-5Z" />
  ),
  dynamic_feed: (
    <path d="M4 4h16v4H4V4Zm0 6h10v4H4v-4Zm0 6h16v4H4v-4Z" />
  ),
  group: (
    <path d="M8.5 11A4.5 4.5 0 1 0 8.5 2a4.5 4.5 0 0 0 0 9Zm7-1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM1.5 19.25C1.5 15.8 4.3 13 7.75 13h1.5c3.45 0 6.25 2.8 6.25 6.25V22h-14v-2.75Zm15.8-6.18c2.95.4 5.2 2.92 5.2 5.93V22h-5v-2.75c0-2.4-.82-4.6-2.2-6.35.65.02 1.32.07 2 .17Z" />
  ),
  groups: (
    <path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2 20v-1.2C2 15.6 4.6 13 7.8 13h.4c3.2 0 5.8 2.6 5.8 5.8V20H2Zm13.2 0v-1.2c0-2-.7-3.8-1.9-5.2.6-.3 1.3-.5 2.1-.5h.2c3 0 5.4 2.4 5.4 5.4V20h-5.8Z" />
  ),
  account_circle: (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a3.2 3.2 0 1 1 0 6.4A3.2 3.2 0 0 1 12 7Zm0 12.2c-2.67 0-5.03-1.33-6.46-3.36.04-2.14 4.3-3.32 6.46-3.32 2.14 0 6.42 1.18 6.46 3.32A7.84 7.84 0 0 1 12 19.2Z" />
  ),
  arrow_drop_down: (
    <path d="m7 9 5 6 5-6H7Z" />
  ),
  calendar_month: (
    <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 18H5V9h14v11ZM7 11h3v3H7v-3Zm0 5h3v3H7v-3Zm5-5h3v3h-3v-3Zm5 0h2v3h-2v-3Zm-5 5h3v3h-3v-3Zm5 0h2v3h-2v-3Z" />
  ),
  event_note: (
    <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 18H5V9h14v11ZM7 11h10v2H7v-2Zm0 4h10v2H7v-2Z" />
  ),
  checklist: (
    <path d="m4 7 2 2 4-4-1.4-1.4L6 6.2 5.4 5.6 4 7Zm8-2h8v2h-8V5ZM4 14l2 2 4-4-1.4-1.4L6 13.2l-.6-.6L4 14Zm8-2h8v2h-8v-2Zm0 7h8v2h-8v-2Z" />
  ),
  inventory_2: (
    <path d="M4 3h16l1 4v2h-1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9H3V7l1-4Zm2.6 2L6.1 7h11.8l-.5-2H6.6ZM6 9v11h12V9H6Zm3 3h6v2H9v-2Z" />
  ),
  auto_awesome: (
    <path d="m12 2 1.3 3.7L17 7l-3.7 1.3L12 12l-1.3-3.7L7 7l3.7-1.3L12 2Zm6 9 1 2.5L21.5 15 19 16.5 18 19l-1-2.5-2.5-1.5 2.5-1.5L18 11ZM6 13l1.4 4.1L11.5 19l-4.1 1.9L6 25l-1.4-4.1L.5 19l4.1-1.9L6 13Z" />
  ),
  circle: <circle cx="12" cy="12" r="8" />,
};

export default function MaterialIcon({
  name,
  size = 20,
  fill = true,
  style,
  className,
  title,
}: Props) {
  const path = PATHS[name] || PATHS.circle;

  return (
    <svg
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={fill ? undefined : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{
        display: "inline-block",
        flexShrink: 0,
        color: "currentColor",
        ...style,
      }}
    >
      {title ? <title>{title}</title> : null}
      {path}
    </svg>
  );
}
