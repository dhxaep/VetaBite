"use client";

let audioCtx: AudioContext | null = null;
let buzzerInterval: ReturnType<typeof setInterval> | null = null;
let audioElement: HTMLAudioElement | null = null;
let isPlaying = false;
let audioUnlocked = false;

const alarmListeners = new Set<(active: boolean) => void>();
const unlockListeners = new Set<(unlocked: boolean) => void>();

function notifyAlarm() {
  alarmListeners.forEach((fn) => {
    try {
      fn(isPlaying);
    } catch {}
  });
}

function notifyUnlock() {
  unlockListeners.forEach((fn) => {
    try {
      fn(audioUnlocked);
    } catch {}
  });
}

export function isAudioUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return audioUnlocked;
}

export function onUnlockChange(cb: (unlocked: boolean) => void): () => void {
  unlockListeners.add(cb);
  cb(audioUnlocked);
  return () => {
    unlockListeners.delete(cb);
  };
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  return audioCtx;
}

/**
 * Membuka izin pemutaran audio browser (Autoplay Policy Unlock)
 * Dapat dipanggil langsung dari klik pengguna atau banner.
 */
export async function unlockAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }

    if (!audioElement) {
      audioElement = new Audio("/sounds/loud-alarm.wav");
      audioElement.loop = true;
      audioElement.volume = 1.0;
    }

    // Pancing pemutaran instan agar browser mengizinkan audio
    audioElement.volume = 1.0;
    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (!isPlaying && audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
          }
        })
        .catch(() => {});
    }

    audioUnlocked = true;
    notifyUnlock();

    // Jika ada alarm yang sempat tertunda karena autoplay blocker, bunyikan sekarang
    if (isPlaying) {
      resumeActiveBuzzer();
    }

    return true;
  } catch {
    return false;
  }
}

// Pasang global listener pada gestur interaksi pertama pengguna
if (typeof window !== "undefined") {
  const autoUnlockHandler = () => {
    unlockAudio();
    window.removeEventListener("click", autoUnlockHandler);
    window.removeEventListener("touchstart", autoUnlockHandler);
    window.removeEventListener("keydown", autoUnlockHandler);
  };

  window.addEventListener("click", autoUnlockHandler, { passive: true });
  window.addEventListener("touchstart", autoUnlockHandler, { passive: true });
  window.addEventListener("keydown", autoUnlockHandler, { passive: true });
}

/**
 * Memainkan satu putaran nada melengking tajam khas kitchen buzzer restoran
 */
function playToneBurst(ctx: AudioContext) {
  try {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Sawtooth memberikan distorsi tajam yang mudah terdengar di tempat bising
    osc1.type = "sawtooth";
    osc2.type = "square";

    // Nada 1: 950 Hz -> 1450 Hz
    osc1.frequency.setValueAtTime(950, now);
    osc1.frequency.exponentialRampToValueAtTime(1450, now + 0.18);

    // Nada 2: 1200 Hz -> 1900 Hz
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(1900, now + 0.18);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  } catch {}
}

function resumeActiveBuzzer() {
  if (typeof window === "undefined") return;

  // 1. Audio element
  try {
    if (!audioElement) {
      audioElement = new Audio("/sounds/loud-alarm.wav");
      audioElement.loop = true;
      audioElement.volume = 1.0;
    }
    audioElement.loop = true;
    audioElement.volume = 1.0;
    audioElement.play().catch(() => {});
  } catch {}

  // 2. Web Audio API pulses
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    playToneBurst(ctx);
    if (!buzzerInterval) {
      buzzerInterval = setInterval(() => {
        if (!isPlaying) return;
        const currentCtx = getAudioContext();
        if (currentCtx) playToneBurst(currentCtx);
      }, 650);
    }
  }

  // 3. Haptic vibration
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([300, 100, 300, 100, 500]);
    } catch {}
  }
}

/**
 * Memulai alarm terus-menerus sampai dimatikan
 */
export function startAlarm(title = "Pesanan Masuk!") {
  isPlaying = true;
  notifyAlarm();

  resumeActiveBuzzer();

  // Jika browser menolak pemutaran awal, siapkan fallback unlocker
  if (typeof window !== "undefined" && !audioUnlocked) {
    const onGesture = () => {
      unlockAudio();
      if (isPlaying) {
        resumeActiveBuzzer();
      }
      window.removeEventListener("click", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };
    window.addEventListener("click", onGesture, { once: true });
    window.addEventListener("touchstart", onGesture, { once: true });
  }
}

/**
 * Membunyikan suara tes singkat (1 kali bunyi) untuk verifikasi speaker
 */
export async function testAlarmSound(): Promise<void> {
  await unlockAudio();
  const ctx = getAudioContext();
  if (ctx) {
    playToneBurst(ctx);
  }
  try {
    const testAudio = new Audio("/sounds/loud-alarm.wav");
    testAudio.volume = 1.0;
    testAudio.play().catch(() => {});
    setTimeout(() => {
      try {
        testAudio.pause();
      } catch {}
    }, 1500);
  } catch {}
}

/**
 * Menghentikan alarm berdering
 */
export function stopAlarm() {
  isPlaying = false;
  notifyAlarm();

  if (buzzerInterval) {
    clearInterval(buzzerInterval);
    buzzerInterval = null;
  }

  if (audioElement) {
    try {
      audioElement.pause();
      audioElement.currentTime = 0;
    } catch {}
  }
}

export function isAlarmActive(): boolean {
  return isPlaying;
}

export function onAlarmChange(cb: (active: boolean) => void): () => void {
  alarmListeners.add(cb);
  cb(isPlaying);
  return () => {
    alarmListeners.delete(cb);
  };
}
