import React from "react";

export default function Connector({ to, type }) {
  const dash = type === "stream" ? "4 2" : "0";
  return (
    <svg width="80" height="2" className="self-center">
      <line
        x1="0"
        y1="1"
        x2="80"
        y2="1"
        stroke="#888"
        strokeWidth="2"
        strokeDasharray={dash}
        markerEnd="url(#arrowhead)"
      />
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="0"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 Z" fill="#888" />
        </marker>
      </defs>
    </svg>
  );
}