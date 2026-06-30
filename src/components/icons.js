// Custom line-art tab icons — hand-drawn paths, soft rounded strokes.
// Stroke recolors with theme; fill stays empty for the MUJI line-art feel.
import React from "react";
import Svg, { Path, Rect, Circle, Line } from "react-native-svg";

const base = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };

export function FridgeIcon({ color, size = 26, active }) {
  const w = active ? 2.4 : 1.9;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="6" y="2.5" width="12" height="19" rx="3.2" stroke={color} strokeWidth={w} {...base} />
      <Line x1="6.4" y1="9.5" x2="17.6" y2="9.5" stroke={color} strokeWidth={w} {...base} />
      <Line x1="9" y1="5.5" x2="9" y2="7.4" stroke={color} strokeWidth={w} {...base} />
      <Line x1="9" y1="12" x2="9" y2="14.4" stroke={color} strokeWidth={w} {...base} />
    </Svg>
  );
}

export function CameraIcon({ color, size = 26, active }) {
  const w = active ? 2.4 : 1.9;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 8.5c0-1.1.9-2 2-2h1.6l1.1-1.6h6.6L16.4 6.5H18c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2z"
        stroke={color} strokeWidth={w} {...base} />
      <Circle cx="12" cy="12.5" r="3.2" stroke={color} strokeWidth={w} {...base} />
    </Svg>
  );
}

export function GearIcon({ color, size = 26, active }) {
  const w = active ? 2.4 : 1.9;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={w} {...base} />
      <Path d="M12 3.2v2.3M12 18.5v2.3M20.8 12h-2.3M5.5 12H3.2M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6M18.2 18.2l-1.6-1.6M7.4 7.4 5.8 5.8"
        stroke={color} strokeWidth={w} {...base} />
    </Svg>
  );
}
