'use client';

export default function StatCard({ label, value, sub, icon }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1 text-green-primary">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          )}
        </div>
        <span className="text-2xl p-2 rounded-xl bg-emerald-50 text-emerald-600">
          {icon}
        </span>
      </div>
    </div>
  );
}
