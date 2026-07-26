import { COLORS } from "./theme";

export type Token = { text: string; c?: string };
export type CodeLine = Token[];

export const kw = (text: string): Token => ({ text, c: COLORS.red });
export const str = (text: string): Token => ({ text, c: COLORS.green });
export const fn = (text: string): Token => ({ text, c: COLORS.blue });
export const tag = (text: string): Token => ({ text, c: COLORS.yellow });
export const num = (text: string): Token => ({ text, c: COLORS.peach });
export const cm = (text: string): Token => ({ text, c: COLORS.subtext });
export const pl = (text: string): Token => ({ text });
