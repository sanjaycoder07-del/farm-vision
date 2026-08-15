import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-slate-900 flex items-center justify-center p-4 md:p-8 font-sans text-white">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-white/10 space-y-8">
        
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl font-serif text-3xl font-bold shadow-lg mb-2">
            FV
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-emerald-100">Welcome to FarmVision</h1>
          <p className="text-emerald-200/80 text-sm md:text-base max-w-md mx-auto">
            Produce Price Forecasting, Spoilage Risk Analytics & Role-Based Marketplace Platform
          </p>
        </div>

        {/* Primary Auth Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/login"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center rounded-2xl shadow-lg transition-all active:scale-[0.98] text-base"
          >
            🔑 Sign In
          </Link>
          <Link
            href="/signup"
            className="w-full py-4 bg-white/20 hover:bg-white/30 text-white font-bold text-center rounded-2xl border border-white/20 transition-all active:scale-[0.98] text-base"
          >
            ✨ Sign Up (Choose Role)
          </Link>
        </div>

        {/* Role Direct Links */}
        <div className="border-t border-white/10 pt-6 space-y-3">
          <p className="text-xs uppercase tracking-wider font-semibold text-emerald-300/70 text-center">
            Role Interface Dashboards
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/farmer"
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 transition-colors text-sm font-semibold"
            >
              <span className="text-2xl">👨‍🌾</span>
              <div>
                <div>Farmer Dashboard</div>
                <div className="text-[11px] text-emerald-300/70 font-normal">Phone OTP Authentication</div>
              </div>
            </Link>

            <Link
              href="/buyer"
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 transition-colors text-sm font-semibold"
            >
              <span className="text-2xl">🛒</span>
              <div>
                <div>Buyer Marketplace</div>
                <div className="text-[11px] text-emerald-300/70 font-normal">Subscription Gating</div>
              </div>
            </Link>

            <Link
              href="/agent"
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 transition-colors text-sm font-semibold"
            >
              <span className="text-2xl">🛡️</span>
              <div>
                <div>Insurance Agency</div>
                <div className="text-[11px] text-emerald-300/70 font-normal">Claims Verification Audit</div>
              </div>
            </Link>

            <Link
              href="/admin"
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 transition-colors text-sm font-semibold"
            >
              <span className="text-2xl">⚙️</span>
              <div>
                <div>Admin Control Panel</div>
                <div className="text-[11px] text-emerald-300/70 font-normal">User & Membership Audit</div>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
