import { stringToColor } from './stringToColor';

export function getTribeColor(tribeName: string): string {
  // Get a base color from the tribe name
  const baseColor = stringToColor(tribeName);
  
  // Convert the color to HSL to make it pastel
  const hue = parseInt(baseColor.substring(1, 3), 16);
  const saturation = parseInt(baseColor.substring(3, 5), 16);
  
  // Create a pastel version by using high lightness and moderate saturation
  return `hsl(${hue}, ${Math.min(60, saturation)}%, 90%)`;
}