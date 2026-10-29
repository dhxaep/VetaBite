# 02 — Design System & Tokens (Liquid Amber Refraction)

> **Konsep Desain:**  
> Desain VetaBite menggunakan sistem **iOS Liquid Glass (Liquid Amber Refraction)**. Sistem ini menggabungkan kedalaman material skeuomorfik, refraksi kaca optik, efek pencahayaan specular rim 1.5px, saturasi tinggi (`blur(22px) saturate(190%)`), dan warna hangat bertema kuliner (Crispy Tangy Orange & Warm Almond Cream).

---

## 1. CSS Variables & Dual Theme (`:root` dan `[data-theme="dark"]`)

Pasang variabel ini di berkas global CSS utama (`src/app/globals.css`):

```css
:root {
  /* Surface & Base Background */
  --bg-base: #F6EFEA;                       /* Almond Cream Warm Base */
  --bg-surface: #FFF8F5;
  --bg-surface-glass: rgba(255, 255, 255, 0.72);
  --bg-surface-glass-alt: rgba(255, 246, 238, 0.85);
  
  /* Text & Neutral Colors */
  --text-primary: #1C130E;                  /* Roasted Espresso */
  --text-muted: #786960;                    /* Warm Cocoa Muted */
  --text-inverse: #FFF8F5;
  
  /* Brand Culinary Accents */
  --primary: #E03A00;                       /* Crispy Tangy Orange */
  --primary-hover: #B82900;
  --primary-glow: rgba(224, 58, 0, 0.28);
  --secondary: #8A1812;                     /* Deep Chili Crimson */
  --tertiary: #FF8A00;                      /* Golden Honey Amber */
  
  /* Status Indicators */
  --status-antrian: #D9A441;                /* Amber Pending */
  --status-masak: #E07A3F;                  /* Deep Orange Cooking */
  --status-siap: #24A148;                   /* Forest Emerald Ready */
  --status-danger: #DC2626;                 /* Ruby Crimson Error/Habis/Banned */
  
  /* Specular Rim & Glass Physics */
  --glass-blur: blur(22px) saturate(190%);
  --glass-border: 1.5px solid rgba(255, 255, 255, 0.92);
  --glass-border-subtle: 1px solid rgba(28, 19, 14, 0.08);
  --glass-shadow: 0 12px 28px -8px rgba(45, 20, 8, 0.10), 0 4px 10px -2px rgba(224, 58, 0, 0.06);
  --glass-cushion-upper: inset 0 2px 3px rgba(255, 255, 255, 0.98);
  --glass-cushion-lower: inset 0 -2px 6px rgba(224, 58, 0, 0.08);
  
  /* Border Radii */
  --radius-sm: 12px;
  --radius-md: 18px;
  --radius-lg: 26px;
  --radius-pill: 9999px;
}

[data-theme="dark"] {
  /* Dark Mode - Deep Roasted Espresso Base */
  --bg-base: #1A1210;
  --bg-surface: #241A15;
  --bg-surface-glass: rgba(38, 26, 20, 0.72);
  --bg-surface-glass-alt: rgba(48, 33, 26, 0.85);
  
  --text-primary: #F6EFEA;
  --text-muted: #B8A296;
  --text-inverse: #1C130E;
  
  --primary: #FF5A1F;
  --primary-hover: #E03A00;
  --primary-glow: rgba(255, 90, 31, 0.35);
  --secondary: #D44238;
  --tertiary: #FFA338;
  
  --glass-blur: blur(24px) saturate(200%);
  --glass-border: 1.5px solid rgba(255, 255, 255, 0.22);
  --glass-border-subtle: 1px solid rgba(255, 255, 255, 0.10);
  --glass-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
  --glass-cushion-upper: inset 0 1.5px 2px rgba(255, 255, 255, 0.25);
  --glass-cushion-lower: inset 0 -2px 6px rgba(0, 0, 0, 0.40);
}
```

---

## 2. Kelas Primitif Kaca (`.glass-card`, `.glass-dock`, `.glass-pill`)

```css
/* Glass Card Container */
.glass-panel {
  background: var(--bg-surface-glass);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow), var(--glass-cushion-upper), var(--glass-cushion-lower);
  border-radius: var(--radius-md);
}

/* Bottom Floating Navigation Dock */
.glass-dock {
  background: var(--bg-surface-glass-alt);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: var(--glass-border);
  box-shadow: 0 16px 36px -8px rgba(35, 15, 6, 0.22), var(--glass-cushion-upper);
  border-radius: var(--radius-pill);
}

/* Primary Glass Button */
.btn-primary {
  background: linear-gradient(180deg, #FF6226 0%, #B82900 100%);
  border: 1px solid rgba(255, 215, 195, 0.65);
  box-shadow: 0 8px 20px var(--primary-glow), inset 0 2px 4px rgba(255, 255, 255, 0.65), inset 0 -3px 6px rgba(138, 24, 18, 0.45);
  color: #FFFFFF;
  border-radius: var(--radius-pill);
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 26px var(--primary-glow);
}
.btn-primary:active {
  transform: scale(0.97);
}
.btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  filter: grayscale(0.8);
}
```

---

## 3. Tipografi (Plus Jakarta Sans)

Font keluarga resmi: **`Plus Jakarta Sans`** (Google Fonts).

| Token | Ukuran | Weight | Line-Height | Letter-Spacing | Penggunaan |
|---|---|---|---|---|---|
| `headline-hero` | 24px | 800 (Bold) | 28px | -0.03em | Judul landing & nama loket utama |
| `headline-lg` | 20px | 800 | 24px | -0.02em | Header halaman & modal |
| `headline-md` | 17px | 700 | 22px | -0.01em | Judul menu makanan & kartu kantin |
| `body-lg` | 14px | 500 | 20px | normal | Teks deskripsi utama |
| `body-sm` | 11px | 400 | 15px | normal | Keterangan bahan & jam buka |
| `label-badge` | 10px | 800 | 12px | +0.05em | Uppercase pill (`BESTSELLER`, `LOKET #01`) |
| `label-price` | 15px | 800 | 18px | -0.01em | Label harga Rupiah (`Rp 15.000`) |

---

## 4. Konfigurasi Tailwind (`tailwind.config.ts`)

Tambahkan token ini pada `tailwind.config.ts` proyek:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        'surface-glass': 'var(--bg-surface-glass)',
        'surface-glass-alt': 'var(--bg-surface-glass-alt)',
        'text-main': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          container: '#D93800',
        },
        secondary: '#8A1812',
        tertiary: '#FF8A00',
        status: {
          antrian: 'var(--status-antrian)',
          masak: 'var(--status-masak)',
          siap: 'var(--status-siap)',
          danger: 'var(--status-danger)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        glass: 'var(--glass-shadow)',
        'primary-glow': '0 8px 24px var(--primary-glow)',
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## 5. Pedoman Ikon & Komponen SVG (Zero Emoji Rule)

1. **Dilarang keras memakai karakter emoji.**
2. **Pakai Lucide React / Inline SVG:**
   * Star rating: `<Star className="w-4 h-4 fill-amber-400 text-amber-400" />`
   * Keranjang: `<ShoppingBag className="w-5 h-5 text-text-main" />`
   * Buka/Tutup Toko: `<Store className="w-5 h-5 text-emerald-500" />`
   * Status Masak: `<Flame className="w-4 h-4 text-orange-500" />`
   * Bukti bayar: `<Receipt className="w-4 h-4" />`
   * Search: `<Search className="w-4 h-4 text-text-muted" />`
3. Stroke seragam: `strokeWidth={1.75}` atau `strokeWidth={2}` dengan sudut membulat (`strokeLinecap="round" strokeLinejoin="round"`).
