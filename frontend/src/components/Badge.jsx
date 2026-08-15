'use client';

export default function Badge({ status }) {
  const map = {
    Active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Sold: "bg-slate-100 text-slate-600 border-slate-200",
    Pending: "bg-amber-100 text-amber-800 border-amber-200",
    Accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
    Paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Payment Processing": "bg-blue-100 text-blue-700 border-blue-200",
    Delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Processing: "bg-blue-100 text-blue-700 border-blue-200",
    Confirmed: "bg-teal-100 text-teal-800 border-teal-200",
    "Under Review": "bg-amber-100 text-amber-800 border-amber-200",
    Submitted: "bg-blue-100 text-blue-700 border-blue-200",
    Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Pending Review": "bg-orange-100 text-orange-800 border-orange-200",
    "Evidence Verification": "bg-purple-100 text-purple-800 border-purple-200",
    Low: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Medium: "bg-amber-100 text-amber-800 border-amber-200",
    High: "bg-red-100 text-red-800 border-red-200",
    "Grade A": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Grade B": "bg-amber-50 text-amber-700 border-amber-200",
    "Grade A+": "bg-purple-50 text-purple-700 border-purple-200"
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-md border ${
        map[status] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}
