import React from "react";
import { trackSorting } from "../utils/analytics";

export default function SortByDateFilter({ value, onChange, className = "" }) {
  const handleChange = (newValue) => {
    onChange(newValue);
    // Track sorting preference
    trackSorting(newValue);
  };

  return (
    <div className={`inline-block ${className}`}>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-400"
        style={{ minWidth: 180 }}
      >
        <option value="newest">Newest to Oldest</option>
        <option value="oldest">Oldest to Newest</option>
      </select>
    </div>
  );
}
