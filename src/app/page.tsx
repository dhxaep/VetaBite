import Link from "next/link";
import { ShieldCheck, Zap, Smartphone, UtensilsCrossed, ArrowRight, MapPin } from "lucide-react";

export default function Welcome() {
  return (
    <div className="min-h-screen flex justify-center items-center p-0 sm:p-4 bg-background-base">
      <div className="relative w-full max-w-[430px] min-h-screen sm:min-h-[880px] sm:max-h-[920px] sm:rounded-[46px] overflow-hidden glass-canvas flex flex-col justify-between shadow-2xl sm:border-[5px] sm:border-surface-glass-alt">
        {/* Top Ambient Status Row (Mobile Header Simulation) */}
        <header className="w-full pt-4 px-6 flex justify-between items-center z-20">
          <div className="status-pill px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="text-label-micro font-label-micro text-on-surface tracking-wider">
              UPN &quot;VETERAN&quot; JAKARTA
            </span>
          </div>
          <div className="status-pill px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-label-micro font-label-micro text-text-muted">KANTIN ONLINE</span>
          </div>
        </header>

        {/* Main Content Flow */}
        <main className="w-full px-margin flex flex-col items-center text-center my-auto pt-2 pb-6 z-10">
          {/* Hero Mascot Presentation Container */}
          <div className="relative w-56 h-56 flex items-center justify-center my-3 mascot-floating">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF6226]/20 via-[#FF8A00]/25 to-transparent blur-2xl transform scale-110 pointer-events-none" />
            <div className="absolute w-[208px] h-[208px] rounded-full border border-white/70 shadow-inner pointer-events-none" />
            <div className="relative w-48 h-48 rounded-full liquid-glass-orb flex items-center justify-center p-3.5 transition-transform duration-300">
              <img
                alt="Maskot VetaBite Kantin UPN Veteran Jakarta"
                className="w-full h-full object-contain rounded-full drop-shadow-md select-none pointer-events-none"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGzjb_suzmk6ln-f-y8WYuLuL7NGVrqoftngFnK2OcqjJi3xWRNifEmr91o3ast0TK8MOTyDkH3YderqzVD-sXoc-Ob2z2N7l7WmP4M0AU2Ky_pwMadnJD2RHmCQKELKHbgX9yV7EkZp0gUrozoRZ9b3j0sIUwB7y9dmYl59auEAyUfph5pd-5Vz346sWJx9TylBhwRaUrJlYZsiAbydeAr5uQd42cQwjnDRWeU0bDYZR6VE5PaJmWwQ"
              />
            </div>
            <div className="absolute -bottom-2 status-pill px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-label-micro font-label-micro text-on-surface-variant font-bold">
                100% HIGIENIS KAMPUS
              </span>
            </div>
          </div>

          {/* Typography Section: Brand Wordmark & Headline */}
          <div className="mt-4 flex flex-col items-center">
            <div className="flex items-center gap-1">
              <h1 className="text-[36px] leading-[40px] tracking-[-0.04em] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#C63000] to-secondary">
                VetaBite
              </h1>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary mb-1" />
            </div>
            <p className="text-label-sm font-label-sm text-text-muted tracking-widest uppercase mt-0.5">
              Portal Pick-Up Kantin Mahasiswa &amp; Dosen
            </p>
            <h2 className="text-headline-hero-mobile font-headline-hero-mobile text-on-background mt-3 max-w-[340px]">
              Pesan Kuliner Kantin, <br />
              <span className="text-primary font-extrabold">Ambil Tanpa Antre</span>
            </h2>
            <p className="text-body-md font-body-md text-text-muted mt-2 max-w-[340px] px-1">
              Nikmati kemudahan pesan makanan &amp; minuman di seluruh loket kantin UPNVJ langsung dari ponselmu. Tinggal
              pesan, pantau proses masak, dan ambil tepat waktu!
            </p>
          </div>

          {/* 3 Micro Value Proposition Glass Cards */}
          <div className="grid grid-cols-3 gap-2 w-full mt-5 px-1">
            <div className="liquid-glass-card rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1.5">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-label-sm font-label-sm text-on-surface leading-tight">Ambil Cepat</span>
              <span className="text-label-micro font-label-micro text-text-muted mt-0.5">Siap Saji</span>
            </div>
            <div className="liquid-glass-card rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-label-sm font-label-sm text-on-surface leading-tight">Bayar Praktis</span>
              <span className="text-label-micro font-label-micro text-text-muted mt-0.5">QRIS &amp; Cash</span>
            </div>
            <div className="liquid-glass-card rounded-2xl p-2.5 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1.5">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-label-sm font-label-sm text-on-surface leading-tight">18+ Loket</span>
              <span className="text-label-micro font-label-micro text-text-muted mt-0.5">Kantin Aktif</span>
            </div>
          </div>
        </main>

        {/* Interactive Call-To-Action Footer Area */}
        <footer className="w-full px-margin pb-7 pt-2 flex flex-col items-center z-20">
          <Link
            className="w-full h-12 rounded-full liquid-cta-btn flex items-center justify-center gap-2 text-white font-headline-sm text-headline-sm no-underline cursor-pointer group select-none shadow-xl"
            href="/login"
          >
            <span>Mulai Pesan Sekarang</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="mt-3.5 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-text-muted">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-body-sm font-body-sm text-text-muted">
                Kampus Pondok Labu &amp; Kampus Limo • UPNVJ
              </span>
            </div>
            <p className="text-label-micro font-label-micro text-outline mt-1">
              Masuk dengan akun kampus — mahasiswa, penjual, dan admin
            </p>
          </div>
          <div className="w-32 h-1 bg-on-surface/20 rounded-full mt-4" />
        </footer>
      </div>
    </div>
  );
}
