"use client";

type IframeNamespace = {
  Player: new (
    element: string | HTMLElement,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: {
        playsinline?: 0 | 1;
        rel?: 0 | 1;
        modestbranding?: 0 | 1;
      };
      events?: {
        onReady?: (event: { target: YouTubePlayer }) => void;
        onError?: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
};

export type YouTubePlayer = {
  getCurrentTime: () => number;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: IframeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let loadPromise: Promise<IframeNamespace> | null = null;

export function loadYouTubeIframeApi(): Promise<IframeNamespace> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("window unavailable"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<IframeNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YT namespace missing"));
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () =>
      reject(new Error("Failed to load YouTube IFrame API"));
    document.head.appendChild(script);
  });
  return loadPromise;
}
