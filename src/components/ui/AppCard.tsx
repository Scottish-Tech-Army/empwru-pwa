import React from "react";

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const AppCard = ({ children, className = "", onClick }: AppCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-6 ${
        onClick ? "cursor-pointer active:scale-[0.99] transition-transform" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};
