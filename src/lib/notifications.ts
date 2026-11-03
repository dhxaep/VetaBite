"use client";

/**
 * Meminta izin notifikasi browser / HP
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    try {
      const res = await Notification.requestPermission();
      return res === "granted";
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Menampilkan notifikasi banner native sistem operasi HP / Browser
 */
export function showNativeNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(title, {
            icon: "/LOGO.jpeg",
            badge: "/LOGO.jpeg",
            ...options,
          });
        })
        .catch(() => {
          sendNotification(title, options);
        });
    } else {
      sendNotification(title, options);
    }
  }
}

function sendNotification(title: string, options?: NotificationOptions) {
  try {
    const notif = new Notification(title, {
      icon: "/LOGO.jpeg",
      badge: "/LOGO.jpeg",
      ...options,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    // Auto close native banner after 8 seconds
    setTimeout(() => {
      try {
        notif.close();
      } catch {}
    }, 8000);
  } catch (err) {
    console.warn("Native Notification trigger error:", err);
  }
}

