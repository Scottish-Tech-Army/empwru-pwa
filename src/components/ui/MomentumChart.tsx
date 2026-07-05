"use client";

import { WeeklyMomentumData } from "@/lib/storage";

interface MomentumChartProps {
  data: WeeklyMomentumData[];
  className?: string;
}

/**
 * SVG-based line chart for displaying weekly momentum/performance velocity.
 * Features a smooth curved line with gradient fill and animated drawing.
 */
export default function MomentumChart({ data, className = "" }: MomentumChartProps) {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-52 text-text-muted ${className}`}>
        No data available
      </div>
    );
  }

  // Chart dimensions - increased for better visibility
  const height = 220;
  const padding = { top: 25, right: 15, bottom: 50, left: 40 };
  
  // Calculate bounds (using viewBox percentage-based width of 100)
  const chartWidth = 100 - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Scale values
  const maxScore = 100;
  const minScore = 0;
  
  // Generate path points
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.score - minScore) / (maxScore - minScore)) * chartHeight,
    score: d.score,
    label: d.weekLabel,
    hasCheckIn: d.hasCheckIn,
  }));
  
  // Create smooth curve using Catmull-Rom to Bezier conversion
  const createSmoothPath = (pts: typeof points): string => {
    if (pts.length < 2) return "";
    
    let path = `M ${pts[0].x} ${pts[0].y}`;
    
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      
      // Control points for smooth curve
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    return path;
  };
  
  // Create area path (for gradient fill)
  const createAreaPath = (pts: typeof points): string => {
    const linePath = createSmoothPath(pts);
    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${padding.top + chartHeight} L ${pts[0].x} ${padding.top + chartHeight} Z`;
    return areaPath;
  };
  
  const linePath = createSmoothPath(points);
  const areaPath = createAreaPath(points);
  
  // Y-axis labels with descriptive text
  const yLabels = [
    { value: 0, label: "0" },
    { value: 25, label: "25" },
    { value: 50, label: "50" },
    { value: 75, label: "75" },
    { value: 100, label: "100" },
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Y-axis title */}
      <div className="flex items-start gap-2">
        <div className="text-[10px] text-text-muted -rotate-90 origin-top-left translate-y-24 -translate-x-2 whitespace-nowrap">
          Score %
        </div>
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-52 flex-1"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Gradient fill under the line */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Y-axis labels and grid lines */}
          {yLabels.map(({ value, label }) => {
            const y = padding.top + chartHeight - (value / maxScore) * chartHeight;
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={100 - padding.right}
                  y2={y}
                  stroke="var(--color-text-subtle)"
                  strokeWidth="0.15"
                  strokeOpacity="0.4"
                  strokeDasharray={value === 0 ? "none" : "0.5"}
                />
                <text
                  x={padding.left - 4}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-text-muted"
                  style={{ fontSize: "3.5px" }}
                >
                  {label}
                </text>
              </g>
            );
          })}
          
          {/* Y-axis line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="var(--color-text-subtle)"
            strokeWidth="0.2"
            strokeOpacity="0.5"
          />
          
          {/* X-axis line */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={100 - padding.right}
            y2={padding.top + chartHeight}
            stroke="var(--color-text-subtle)"
            strokeWidth="0.2"
            strokeOpacity="0.5"
          />
          
          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            className="transition-all duration-500"
          />
          
          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-brand-primary)"
            strokeWidth="0.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />
          
          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={point.hasCheckIn ? 1.2 : 0.8}
              fill={point.hasCheckIn ? "var(--color-brand-primary)" : "var(--color-text-subtle)"}
              className="transition-all duration-300"
            />
          ))}
          
          {/* X-axis labels */}
          {points.map((point, i) => (
            <g key={i}>
              <text
                x={point.x}
                y={height - 25}
                textAnchor="middle"
                className="fill-text-muted"
                style={{ fontSize: "3px" }}
              >
                {point.label}
              </text>
              {/* Score value below date */}
              <text
                x={point.x}
                y={height - 15}
                textAnchor="middle"
                className={point.hasCheckIn ? "fill-brand-primary" : "fill-text-subtle"}
                style={{ fontSize: "2.5px", fontWeight: point.hasCheckIn ? 600 : 400 }}
              >
                {point.score}%
              </text>
            </g>
          ))}
        </svg>
      </div>
      
      {/* X-axis title */}
      <div className="text-[10px] text-text-muted text-center mt-1">
        Week Starting
      </div>
    </div>
  );
}
