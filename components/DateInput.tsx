"use client";

export function DateInput({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <input
      type="date"
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        height: 48,
        minHeight: 48,
        maxHeight: 48,
        boxSizing: "border-box",
        border: "1.5px solid #E5E7EB",
        borderRadius: 10,
        background: "#fff",
        color: "#111827",
        fontSize: 14,
        fontWeight: 700,
        padding: "0 10px",
        outline: "none",
        overflow: "hidden"
      }}
    />
  );
}

export default DateInput;
