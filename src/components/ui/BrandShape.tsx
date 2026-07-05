import React from "react";

interface BrandShapeProps {
  id: number; // 1 to 72
  className?: string; // Should include width, height, and background color (e.g., "w-24 h-24 bg-brand-primary")
  style?: React.CSSProperties;
}

export const BrandShape = ({ id, className = "", style }: BrandShapeProps) => {
  // Ensure id is within range
  const safeId = Math.max(1, Math.min(72, Math.floor(id)));
  const url = encodeURI(`/brand_assets/shapes/Shape ${safeId}.svg`);
  
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: `url('${url}')`,
    maskImage: `url('${url}')`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    ...style,
  };

  return (
    <div
      className={`block ${className}`}
      style={maskStyle}
      role="presentation"
      aria-hidden="true"
    />
  );
};
