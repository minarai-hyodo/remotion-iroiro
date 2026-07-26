import { loadFont as loadSans, fontFamily as sansFontFamily } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono, fontFamily as monoFontFamilyRaw } from "@remotion/google-fonts/JetBrainsMono";

loadSans("normal", { weights: ["400", "600", "700", "800"] });
loadMono("normal", { weights: ["400", "500", "600"] });

export const fontFamily = sansFontFamily;
export const monoFontFamily = monoFontFamilyRaw;
