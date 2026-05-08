import { Gowun_Batang, Nanum_Brush_Script } from "next/font/google";

export const nanumBrush = Nanum_Brush_Script({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-brush",
  weight: ["400"],
});

export const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gowun",
  weight: ["400", "700"],
});
