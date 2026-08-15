'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Avatar from './Avatar';

export default function Sidebar({ role = "farmer", plan = "premium", user = { name: "User" } }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const farmerNav = [
    { icon: "🏠", label: "Dashboard", view: "/farmer" },
    { icon: "🌾", label: "My Crops", view: "/farmer/crops" },
    { icon: "📈", label: "AI Prediction", view: "/farmer/prediction" },
    { icon: "🛒", label: "Marketplace", view: "/farmer/marketplace" },
    { icon: "💰", label: "My Sales", view: "/farmer/sales" },
    ...(plan === "premium"
      ? [
          { icon: "🛡️", label: "Insurance", view: "/farmer/insurance" },
          { icon: "📋", label: "My Claims", view: "/farmer/claims" },
        ]
      : [{ icon: "🔒", label: "Insurance (PRO)", view: "/farmer/insurance" }]),
    { icon: "👤", label: "Profile", view: "/farmer/profile" },
  ];

  const buyerNav = [
    { icon: "🏠", label: "Dashboard", view: "/buyer" },
    { icon: "🛒", label: "Marketplace", view: "/buyer/marketplace" },
    { icon: "📦", label: "My Orders", view: "/buyer/orders" },
    { icon: "👤", label: "Profile", view: "/buyer/profile" },
  ];

  const agentNav = [
    { icon: "🏠", label: "Dashboard", view: "/agent" },
    { icon: "📋", label: "Claims", view: "/agent/claims" },
    { icon: "✅", label: "Verify Claim", view: "/agent/verify" },
  ];

  const adminNav = [
    { icon: "🏠", label: "Dashboard", view: "/admin" },
    { icon: "👥", label: "Users", view: "/admin/users" },
    { icon: "📊", label: "Reports", view: "/admin/reports" },
  ];

  const nav =
    role === "farmer"
      ? farmerNav
      : role === "buyer"
      ? buyerNav
      : role === "agent"
      ? agentNav
      : adminNav;

  return (
    <aside
      className="h-screen flex flex-col border-r border-gray-100 bg-white transition-all duration-300 shadow-xs sticky top-0"
      style={{
        width: collapsed ? 64 : 240,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-green-primary">
          FV
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-green-primary font-serif">
            FarmVision
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-400 hover:text-gray-700 text-lg flex-shrink-0 cursor-pointer"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={9} />
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {user.name}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 capitalize">{role}</span>
                {plan === "premium" && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: "#e8a020" }}
                  >
                    PRO
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const isActive = pathname === item.view;
          return (
            <Link
              key={item.view}
              href={item.view}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "text-white shadow-xs bg-green-primary"
                  : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-800"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
