import React, { useState } from "react";
import { FileDown, Calendar, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../../services/api";

const FILTERS = [
  { value: "all",    label: "All Time",     desc: "Every idea ever submitted" },
  { value: "week",   label: "This Week",    desc: "Last 7 days" },
  { value: "month",  label: "This Month",   desc: "Last 30 days" },
  { value: "custom", label: "Custom Range", desc: "Pick a start and end date" },
];

export default function ExportPage() {
  const [filter, setFilter]     = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState(null);
  const [errMsg, setErrMsg]     = useState("");

  const handleDownload = async () => {
    if (filter === "custom" && (!fromDate || !toDate)) {
      setErrMsg("Please select both a start and end date.");
      setStatus("error");
      return;
    }
    setLoading(true);
    setStatus(null);
    setErrMsg("");
    try {
      const params =
        filter === "all"    ? {} :
        filter === "custom" ? { filter: "custom", from: fromDate, to: toDate } :
                              { filter };
      await api.downloadIdeasExcel(params);
      setStatus("success");
    } catch (err) {
      setErrMsg(err.message || "Export failed. Please try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-2">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-[#1D3368]/10 flex items-center justify-center">
            <FileDown className="h-5 w-5 text-[#1D3368]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1D3368] leading-tight">Export Ideas</h1>
            <p className="text-sm text-gray-500">Director-level Excel report of all submitted ideas</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
          <p className="text-sm font-semibold text-gray-700">Select Date Range</p>
        </div>
        <div className="p-6 space-y-3">
          {FILTERS.map(f => (
            <label
              key={f.value}
              className={`flex items-center gap-4 p-3.5 rounded-xl border cursor-pointer transition-all ${
                filter === f.value
                  ? "border-[#1D3368]/40 bg-[#1D3368]/5"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                filter === f.value ? "border-[#1D3368]" : "border-gray-300"
              }`}>
                {filter === f.value && <div className="h-2 w-2 rounded-full bg-[#1D3368]" />}
              </div>
              <input
                type="radio"
                name="filter"
                value={f.value}
                checked={filter === f.value}
                onChange={() => { setFilter(f.value); setStatus(null); }}
                className="sr-only"
              />
              <div>
                <p className={`text-sm font-semibold ${filter === f.value ? "text-[#1D3368]" : "text-gray-700"}`}>
                  {f.label}
                </p>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </div>
            </label>
          ))}

          {filter === "custom" && (
            <div className="flex gap-3 mt-2 pt-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  <Calendar size={12} className="inline mr-1" />From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={e => { setFromDate(e.target.value); setStatus(null); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D3368]/20 focus:border-[#1D3368]/40 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  <Calendar size={12} className="inline mr-1" />To
                </label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={e => { setToDate(e.target.value); setStatus(null); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D3368]/20 focus:border-[#1D3368]/40 transition-all"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {status === "success" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="text-sm font-medium">Excel file downloaded successfully!</p>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-sm font-medium">{errMsg}</p>
        </div>
      )}

      <button
        id="export-download-btn"
        onClick={handleDownload}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-[#1D3368] text-white font-semibold text-sm hover:bg-[#162856] active:scale-[0.98] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 size={17} className="animate-spin" /> Generating Excel&hellip;</>
          : <><FileDown size={17} /> Download Excel Report</>
        }
      </button>

      <p className="text-xs text-gray-400 text-center">
        Exports all non-draft ideas &middot; Columns: Idea #, Title, Summary, Submitted By, Department, Date, Status, Approved By
      </p>
    </div>
  );
}
