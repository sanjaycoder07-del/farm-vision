'use client';

export default function Avatar({ name, size = 8 }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "FV";
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-xs bg-green-primary`}
      style={{ flexShrink: 0 }}
    >
      {initials}
    </div>
  );
}
