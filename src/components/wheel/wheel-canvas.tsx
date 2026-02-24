'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import type { WheelSegment } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WheelCanvasProps {
  segments: WheelSegment[];
  size?: number;
  spinning?: boolean;
  onSpinEnd?: (segment: WheelSegment) => void;
  targetSegmentId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Slightly darken a hex colour */
function darkenColor(hex: string, amount: number = 0.15): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * amount));
  const g = Math.max(0, (((num >> 8) & 0xff) - Math.round(255 * amount)));
  const b = Math.max(0, ((num & 0xff) - Math.round(255 * amount)));
  return `rgb(${r},${g},${b})`;
}

/** Slightly lighten a hex colour */
function lightenColor(hex: string, amount: number = 0.18): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, (((num >> 8) & 0xff) + Math.round(255 * amount)));
  const b = Math.min(255, ((num & 0xff) + Math.round(255 * amount)));
  return `rgb(${r},${g},${b})`;
}

/** Describe an SVG arc path */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = {
    x: cx + r * Math.cos(toRad(startAngle)),
    y: cy + r * Math.sin(toRad(startAngle)),
  };
  const end = {
    x: cx + r * Math.cos(toRad(endAngle)),
    y: cy + r * Math.sin(toRad(endAngle)),
  };
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

/** Get a text-appropriate colour (white or dark) based on background luminance */
function textColor(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1A1A2E' : '#FFFFFF';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WheelCanvas({
  segments,
  size = 350,
  spinning = false,
  onSpinEnd,
  targetSegmentId,
}: WheelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotation = useMotionValue(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoverRotation, setHoverRotation] = useState(0);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);

  const segmentCount = segments.length;
  const anglePerSegment = segmentCount > 0 ? 360 / segmentCount : 360;

  // Responsive sizing
  const [responsiveSize, setResponsiveSize] = useState(size);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const available = Math.min(parent.clientWidth - 32, size);
          setResponsiveSize(Math.max(250, available));
        }
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

  const s = responsiveSize;
  const cx = s / 2;
  const cy = s / 2;
  const radius = s / 2 - 12;

  // Combined rotation value: motionValue + hover offset
  const displayRotation = useTransform(rotation, (v) => v + hoverRotation);

  // ---- Calculate landing angle for target segment ----
  const calculateTargetAngle = useCallback(() => {
    if (!targetSegmentId || segmentCount === 0) return 0;

    const targetIndex = segments.findIndex((seg) => seg.id === targetSegmentId);
    if (targetIndex === -1) return 0;

    // Segments are drawn starting from -90deg (top), going clockwise.
    // The pointer is fixed at top (-90deg).
    // When the wheel rotates R degrees clockwise, the point originally
    // at angle (-90 - R) ends up under the pointer.
    // Segment i center is at angle: -90 + (i + 0.5) * anglePerSegment
    // For it to land under pointer: R = 360n - (i + 0.5) * anglePerSegment
    const segCenterAngle = (targetIndex + 0.5) * anglePerSegment;

    // Total spins: random 5-8 full turns + land on target
    const fullTurns = 5 + Math.random() * 3;
    const totalRotation = (Math.ceil(fullTurns) + 1) * 360 - segCenterAngle;

    return totalRotation;
  }, [targetSegmentId, segments, segmentCount, anglePerSegment]);

  // ---- Spin animation ----
  useEffect(() => {
    if (!spinning || isAnimating || segmentCount === 0) return;

    setIsAnimating(true);
    setHoverRotation(0);

    const targetAngle = calculateTargetAngle();
    const currentRotation = rotation.get();
    const finalRotation = currentRotation + targetAngle;

    // Animate using motion/react's animate function
    // Custom easing that accelerates, holds speed, then decelerates
    animationRef.current = animate(rotation, finalRotation, {
      duration: 5,
      ease: [0.15, 0.6, 0.25, 1],
      onComplete: () => {
        setIsAnimating(false);

        // Determine which segment we landed on
        if (targetSegmentId) {
          const winner = segments.find((seg) => seg.id === targetSegmentId);
          if (winner && onSpinEnd) {
            onSpinEnd(winner);
          }
        }
      },
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [spinning]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Hover tilt ----
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isAnimating) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const angle = Math.atan2(y, x) * (180 / Math.PI);
      setHoverRotation(angle * 0.02); // very subtle
    },
    [isAnimating],
  );

  const handleMouseLeave = useCallback(() => {
    if (!isAnimating) setHoverRotation(0);
  }, [isAnimating]);

  // ---- SVG segment definitions ----
  const segmentDefs = useMemo(() => {
    if (segmentCount === 0) return [];

    return segments.map((seg, i) => {
      const startAngle = -90 + i * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;
      const midAngle = startAngle + anglePerSegment / 2;

      // Text position: along the middle of the arc, ~60% outward
      const textR = radius * 0.62;
      const emojiR = radius * 0.38;

      const textX = cx + textR * Math.cos(toRad(midAngle));
      const textY = cy + textR * Math.sin(toRad(midAngle));
      const emojiX = cx + emojiR * Math.cos(toRad(midAngle));
      const emojiY = cy + emojiR * Math.sin(toRad(midAngle));

      return {
        ...seg,
        index: i,
        startAngle,
        endAngle,
        midAngle,
        textX,
        textY,
        emojiX,
        emojiY,
        path: describeArc(cx, cy, radius, startAngle, endAngle),
      };
    });
  }, [segments, segmentCount, anglePerSegment, cx, cy, radius]);

  // ---- Tick marks on outer ring ----
  const tickMarks = useMemo(() => {
    const ticks: { x1: number; y1: number; x2: number; y2: number; isMain: boolean }[] = [];
    const tickCount = segmentCount * 4;
    for (let i = 0; i < tickCount; i++) {
      const angle = toRad(-90 + (i / tickCount) * 360);
      const isMain = i % 4 === 0;
      const outerR = radius + 6;
      const innerR = isMain ? radius - 2 : radius + 1;
      ticks.push({
        x1: cx + innerR * Math.cos(angle),
        y1: cy + innerR * Math.sin(angle),
        x2: cx + outerR * Math.cos(angle),
        y2: cy + outerR * Math.sin(angle),
        isMain,
      });
    }
    return ticks;
  }, [segmentCount, radius, cx, cy]);

  if (segmentCount === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-border/20"
        style={{ width: s, height: s }}
      >
        <p className="text-text-muted text-sm font-body">Ajoutez des segments</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      style={{ width: s, height: s + 24 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ---- Pointer / Indicator at top ---- */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-20"
        style={{ top: -2 }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M14 26L3 4h22L14 26z"
            fill="#FF6B35"
            stroke="#1B2A4A"
            strokeWidth="2"
          />
          <path
            d="M14 22L6 6h16L14 22z"
            fill="#FF8F66"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* ---- Wheel SVG ---- */}
      <motion.div
        style={{ rotate: displayRotation }}
        className="will-change-transform"
      >
        <svg
          width={s}
          height={s}
          viewBox={`0 0 ${s} ${s}`}
          className="drop-shadow-xl"
        >
          <defs>
            {/* Segment gradients */}
            {segmentDefs.map((seg) => (
              <radialGradient
                key={`grad-${seg.id}`}
                id={`grad-${seg.id}`}
                cx="50%"
                cy="50%"
                r="55%"
              >
                <stop offset="0%" stopColor={lightenColor(seg.color, 0.1)} />
                <stop offset="100%" stopColor={darkenColor(seg.color, 0.08)} />
              </radialGradient>
            ))}

            {/* Shadow filter for the outer ring */}
            <filter id="wheel-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.18" />
            </filter>

            {/* Inner shadow for depth */}
            <filter id="inner-glow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadow" />
              <feFlood floodColor="#000" floodOpacity="0.12" result="color" />
              <feComposite in="color" in2="shadow" operator="in" />
            </filter>
          </defs>

          {/* ---- Outer ring background ---- */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 8}
            fill="#1B2A4A"
            filter="url(#wheel-shadow)"
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius + 7}
            fill="none"
            stroke="url(#outer-ring-grad)"
            strokeWidth="1"
          />

          {/* Decorative outer ring gradient */}
          <defs>
            <linearGradient id="outer-ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#FF6B35" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* ---- Tick marks ---- */}
          {tickMarks.map((tick, i) => (
            <line
              key={`tick-${i}`}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={tick.isMain ? '#FFD700' : 'rgba(255,255,255,0.3)'}
              strokeWidth={tick.isMain ? 1.5 : 0.5}
              strokeLinecap="round"
            />
          ))}

          {/* ---- Segments ---- */}
          {segmentDefs.map((seg) => (
            <g key={seg.id}>
              {/* Segment arc */}
              <path
                d={seg.path}
                fill={`url(#grad-${seg.id})`}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />

              {/* Separator line */}
              <line
                x1={cx}
                y1={cy}
                x2={cx + radius * Math.cos(toRad(seg.startAngle))}
                y2={cy + radius * Math.sin(toRad(seg.startAngle))}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
              />

              {/* Emoji */}
              <text
                x={seg.emojiX}
                y={seg.emojiY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={s * 0.065}
                transform={`rotate(${seg.midAngle + 90}, ${seg.emojiX}, ${seg.emojiY})`}
              >
                {seg.emoji}
              </text>

              {/* Label text */}
              <text
                x={seg.textX}
                y={seg.textY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.min(s * 0.032, 12)}
                fontWeight="600"
                fontFamily="var(--font-sora), system-ui, sans-serif"
                fill={textColor(seg.color)}
                transform={`rotate(${seg.midAngle + 90}, ${seg.textX}, ${seg.textY})`}
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
              >
                {seg.label.length > 14 ? seg.label.slice(0, 13) + '\u2026' : seg.label}
              </text>
            </g>
          ))}

          {/* ---- Center hub ---- */}
          {/* Outer ring of hub */}
          <circle
            cx={cx}
            cy={cy}
            r={s * 0.1}
            fill="#1B2A4A"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
          />
          {/* Inner gradient circle */}
          <circle
            cx={cx}
            cy={cy}
            r={s * 0.075}
            fill="url(#hub-gradient)"
          />
          <defs>
            <radialGradient id="hub-gradient" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#FF8F66" />
              <stop offset="100%" stopColor="#FF6B35" />
            </radialGradient>
          </defs>

          {/* Hub icon - "R" for revieww */}
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={s * 0.055}
            fontWeight="800"
            fontFamily="var(--font-sora), system-ui, sans-serif"
            fill="white"
          >
            R
          </text>

          {/* Subtle shine on hub */}
          <ellipse
            cx={cx - s * 0.015}
            cy={cy - s * 0.025}
            rx={s * 0.035}
            ry={s * 0.018}
            fill="rgba(255,255,255,0.25)"
          />
        </svg>
      </motion.div>

      {/* ---- Spin glow effect when animating ---- */}
      {isAnimating && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.4, 0.2, 0.4, 0],
            scale: [1, 1.03, 1.01, 1.03, 1],
          }}
          transition={{ duration: 5, ease: 'linear' }}
          style={{
            background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)',
          }}
        />
      )}
    </div>
  );
}
