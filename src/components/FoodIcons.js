// Filled, colored kawaii food icons (skeuomorphic, per FridgeUiRedesignSpec).
// CategoryIcon ignores stroke color — these are intentionally multi-color.
import React from "react";
import Svg, { Path, Circle, Rect, Ellipse, G } from "react-native-svg";

function Dairy() {
  return (
    <>
      <Rect x="15" y="3" width="18" height="8" rx="4" fill="#A7C7E6" />
      <Rect x="17.5" y="9" width="13" height="8" fill="#FBFDFF" stroke="#BCD3EB" strokeWidth={2} />
      <Path d="M13 17 H35 V38 a6 6 0 0 1-6 6 H19 a6 6 0 0 1-6-6 Z" fill="#FBFDFF" stroke="#BCD3EB" strokeWidth={2.4} />
      <Rect x="16.5" y="27" width="15" height="11" rx="3" fill="#DCEAF8" />
    </>
  );
}

function Other() {
  return (
    <>
      <Path d="M13 9 H35 V15 H13 Z" fill="#E3CFAF" />
      <Path d="M15 14 H33 V40 a4 4 0 0 1-4 4 H19 a4 4 0 0 1-4-4 Z" fill="#D9C3A0" />
      <Rect x="23.5" y="5" width="2.6" height="11" rx="1.3" fill="#CBB288" />
      <Path d="M24 22 l1.8 4 4.4 .3 -3.4 2.8 1.2 4.3 -4-2.4 -4 2.4 1.2-4.3 -3.4-2.8 4.4-.3 Z" fill="#F0E4CE" />
    </>
  );
}

function Cheese() {
  return (
    <>
      <Path d="M5 24 L40 8 L40 40 Z" fill="#F2D680" />
      <Circle cx="27" cy="18" r="3" fill="#F8E9B0" />
      <Circle cx="32" cy="29" r="2.4" fill="#F8E9B0" />
      <Circle cx="22" cy="28" r="2" fill="#F8E9B0" />
    </>
  );
}

function Meat() {
  return (
    <>
      <Path d="M9 17 C9 11.5 15 8 23 8 C32.5 8 40 12.5 40 18.5 C40 26.5 33 32 24 33 C14 34 9 26.5 9 17 Z" fill="#EFB4BC" />
      <Ellipse cx="24" cy="17" rx="11" ry="4" fill="#F4CDD3" transform="rotate(-8 24 17)" />
      <Ellipse cx="25" cy="25" rx="8" ry="2.6" fill="#F4CDD3" transform="rotate(6 25 25)" />
      <Circle cx="10" cy="23" r="6" fill="#FFF7F3" stroke="#E7AEB5" strokeWidth={2.4} />
    </>
  );
}

function Soup() {
  return (
    <>
      <Path d="M19 5 C17 8.5 21 10.5 19 14" stroke="#E4D3BC" strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <Path d="M27 4 C25 7.5 29 9.5 27 13" stroke="#E4D3BC" strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <Ellipse cx="24" cy="23" rx="18" ry="5" fill="#D8BD98" />
      <Ellipse cx="24" cy="22.5" rx="15" ry="3.6" fill="#F0DFC0" />
      <Path d="M7 24 A17 11 0 0 0 41 24 Z" fill="#FBF4E8" stroke="#E0CBA9" strokeWidth={2.4} />
    </>
  );
}

function Veg() {
  return (
    <>
      {/* broccoli */}
      <Rect x="11" y="26" width="7" height="16" rx="3.5" fill="#B7CC8E" />
      <Circle cx="11" cy="22" r="8" fill="#97BE7E" />
      <Circle cx="19" cy="19" r="9" fill="#A2C888" />
      <Circle cx="14" cy="25" r="7" fill="#8FB873" />
      <Circle cx="24" cy="24" r="6" fill="#A2C888" />
      {/* carrot */}
      <Path d="M30 22 L41 22 L36 42 a.6 .6 0 0 1-1 0 Z" fill="#E7A865" />
      <Path d="M35.5 21 V17 M35.5 18 C34 16.5 32.5 17 32 18.8 M35.5 18 C37 16.5 38.5 17 39 18.8" stroke="#8FB873" strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Path d="M33.5 27 H37.5 M34 31 H37" stroke="#D89149" strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

const MAP = { cheese: Cheese, meat: Meat, dairy: Dairy, veg: Veg, soup: Soup, other: Other };

export function CategoryIcon({ catKey, size = 28 }) {
  const Glyph = MAP[catKey] || Other;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <G><Glyph /></G>
    </Svg>
  );
}

export function FoodPlaceholder({ color = "#C9BEB0", size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Ellipse cx="24" cy="27" rx="16" ry="6.5" fill="none" stroke={color} strokeWidth={3} />
      <Ellipse cx="24" cy="27" rx="8.5" ry="3.2" fill="none" stroke={color} strokeWidth={3} />
      <Path d="M12 17 C16 14 32 14 36 17" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
