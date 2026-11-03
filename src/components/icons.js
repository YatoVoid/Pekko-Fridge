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

export function EditIcon({ color, size = 26, active }) {
  const w = active ? 2.4 : 1.9;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M14.6 5.4l4 4" stroke={color} strokeWidth={w} {...base} />
      <Path d="M4.5 19.5l1-4L15.4 5.6c.8-.8 2.1-.8 2.9 0l.1.1c.8.8.8 2.1 0 2.9L8.5 18.5z"
        stroke={color} strokeWidth={w} {...base} />
    </Svg>
  );
}

export function CheckIcon({ color, size = 26, active }) {
  const w = active ? 2.6 : 2.2;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.2 4.5L19 6.8" stroke={color} strokeWidth={w} {...base} />
    </Svg>
  );
}

export function PlusIcon({ color, size = 26 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5.5v13M5.5 12h13" stroke={color} strokeWidth={2.1} {...base} />
    </Svg>
  );
}

export function CloseIcon({ color, size = 26 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 7l10 10M17 7L7 17" stroke={color} strokeWidth={2.2} {...base} />
    </Svg>
  );
}

export function EyeIcon({ color, size = 26 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2.6 12C5.5 7.5 8.6 5.5 12 5.5s6.5 2 9.4 6.5c-2.9 4.5-6 6.5-9.4 6.5S5.5 16.5 2.6 12z"
        stroke={color} strokeWidth={1.9} {...base} />
      <Circle cx="12" cy="12" r="2.9" stroke={color} strokeWidth={1.9} {...base} />
    </Svg>
  );
}

export function EyeOffIcon({ color, size = 26 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2.6 12C5.5 7.5 8.6 5.5 12 5.5c1.2 0 2.4.25 3.5.72M20.2 9.4c.45.5.9 1.06 1.2 1.6-2.9 4.5-6 6.5-9.4 6.5-.9 0-1.8-.14-2.6-.42"
        stroke={color} strokeWidth={1.9} {...base} />
      <Path d="M4 4l16 16" stroke={color} strokeWidth={1.9} {...base} />
    </Svg>
  );
}
