import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showArea?: boolean;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 30,
  color = 'var(--color-accent-500)',
  strokeWidth = 2,
  showArea = true,
  className = ''
}) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Normalize data to fit in height
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2; // 2px padding
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Create area path
  const areaD = showArea 
    ? `${pathD} L ${width},${height} L 0,${height} Z`
    : '';

  return (
    <svg 
      width={width} 
      height={height} 
      className={`overflow-visible ${className}`}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {showArea && (
        <path
          d={areaD}
          fill="url(#sparklineGradient)"
          stroke="none"
        />
      )}
      
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
        }}
      />
    </svg>
  );
};

export default Sparkline;
