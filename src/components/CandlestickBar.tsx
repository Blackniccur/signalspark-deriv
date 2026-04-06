import { Rectangle } from 'recharts';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  sma: number | null;
}

interface CandlestickBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: CandleData;
  yAxis?: { scale: (v: number) => number };
}

export const CandlestickBar = (props: CandlestickBarProps) => {
  const { x, width, payload, yAxis } = props;
  if (!payload || !yAxis || x === undefined || width === undefined) return null;

  const { open, high, low, close } = payload;
  const isUp = close >= open;
  const color = isUp ? '#34d399' : '#f87171';

  const yHigh = yAxis.scale(high);
  const yLow = yAxis.scale(low);
  const yOpen = yAxis.scale(open);
  const yClose = yAxis.scale(close);

  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1);
  const barWidth = Math.max(width * 0.6, 2);
  const barX = x + (width - barWidth) / 2;
  const wickX = x + width / 2;

  return (
    <g>
      <line x1={wickX} y1={yHigh} x2={wickX} y2={yLow} stroke={color} strokeWidth={1} />
      <rect
        x={barX}
        y={bodyTop}
        width={barWidth}
        height={bodyHeight}
        fill={isUp ? color : color}
        fillOpacity={isUp ? 0.3 : 0.8}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

export type { CandleData };
