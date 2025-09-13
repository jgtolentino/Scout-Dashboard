import React from "react";
import classNames from "classnames";

export default function LayerCard({ title, icon: Icon, color, desc }) {
  return (
    <div
      className={classNames(
        "flex flex-col items-center p-4 rounded-lg shadow hover:shadow-lg transition",
        `bg-${color}/20 border-2 border-${color}`
      )}
      title={desc}
    >
      <Icon className={`w-10 h-10 text-${color}`} />
      <span className="mt-2 font-semibold text-center">{title}</span>
    </div>
  );
}