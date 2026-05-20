"use client";

type NaganiSoundKey =
  | "button"
  | "spin"
  | "reelStop"
  | "win"
  | "bigWin";

const SOUND_ASSETS_READY = false;

const SOUND_PATHS: Record<NaganiSoundKey, string> = {
  button: "/assets/nagani/sounds/button.mp3",
  spin: "/assets/nagani/sounds/spin.mp3",
  reelStop: "/assets/nagani/sounds/reel-stop.mp3",
  win: "/assets/nagani/sounds/win.mp3",
  bigWin: "/assets/nagani/sounds/big-win.mp3",
};

const volumeMap: Record<NaganiSoundKey, number> = {
  button: 0.35,
  spin: 0.45,
  reelStop: 0.28,
  win: 0.55,
  bigWin: 0.75,
};

export function playNaganiSound(soundKey: NaganiSoundKey) {
  if (!SOUND_ASSETS_READY) return;

  if (typeof window === "undefined") return;

  try {
    const audio = new Audio(SOUND_PATHS[soundKey]);
    audio.volume = volumeMap[soundKey];
    audio.currentTime = 0;

    void audio.play().catch(() => {
      // Browser may block sound until user interaction.
    });
  } catch {
    // Keep gameplay safe if audio fails.
  }
}