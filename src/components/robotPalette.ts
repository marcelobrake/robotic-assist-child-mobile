export const THINKING_COLORS = [
  "#8ff5ff",
  "#f3d779",
  "#73e6a2",
  "#ff9ad5",
  "#c9a5ff",
  "#ffa75d",
  "#7be08a",
  "#8bd8ff",
];

export function randomThinkingColor(): string {
  const index = Math.floor(Math.random() * THINKING_COLORS.length);
  return THINKING_COLORS[index] ?? THINKING_COLORS[0]!;
}
