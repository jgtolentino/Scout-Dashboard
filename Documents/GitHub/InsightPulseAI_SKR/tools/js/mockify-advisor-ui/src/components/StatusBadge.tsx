
import { cn } from "@/lib/utils";
import React from "react";

interface StatusBadgeProps {
  label: string;
  status: "active" | "inactive" | "warning" | "error" | "success" | string;
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({ 
  label, 
  status, 
  className, 
  pulse = false 
}: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-azure-greenLight/20 text-azure-green border-azure-green/30";
      case "inactive":
        return "bg-azure-grayLight/20 text-azure-gray border-azure-grayLight/30";
      case "warning":
        return "bg-azure-orangeLight/20 text-azure-orange border-azure-orange/30";
      case "error":
        return "bg-azure-redLight/20 text-azure-red border-azure-red/30";
      case "success":
        return "bg-azure-greenLight/20 text-azure-green border-azure-green/30";
      default:
        return "bg-azure-blueLight/20 text-azure-blue border-azure-blue/30";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border relative",
        getStatusStyles(),
        pulse && "before:absolute before:inset-0 before:rounded-full before:animate-ping before:bg-current before:opacity-25",
        className
      )}
    >
      {status === "active" || status === "success" ? (
        <span className="w-1.5 h-1.5 bg-azure-green rounded-full mr-1.5"></span>
      ) : status === "warning" ? (
        <span className="w-1.5 h-1.5 bg-azure-orange rounded-full mr-1.5"></span>
      ) : status === "error" ? (
        <span className="w-1.5 h-1.5 bg-azure-red rounded-full mr-1.5"></span>
      ) : null}
      {label}
    </span>
  );
}

export default StatusBadge;
