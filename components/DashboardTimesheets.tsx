"use client";

import { createClient } from "@/lib/supabase/client";
import { Timesheet } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";

interface DashboardTimesheetsProps {
  employeeId: string;
}

export default function DashboardTimesheets({
  employeeId,
}: DashboardTimesheetsProps) {
  const supabase = createClient();

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("timesheets")
      .select(
        `*, project:projects(id, name, active, created_at), task:tasks(id, name, project_id, active, created_at)`
      )
      .eq("employee_id", employeeId)
      .order("date", { ascending: false })
      .order("submitted_at", { ascending: false })
      .limit(50);

    const allData = data || [];

    // ✅ Current week Monday-Friday
    const today = new Date();

    const monday = new Date(today);

    const day = monday.getDay();

    const diff = monday.getDate() - ((day + 6) % 7);

    monday.setDate(diff);

    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);

    friday.setDate(monday.getDate() + 4);

    friday.setHours(23, 59, 59, 999);

    const weekData = allData.filter((ts) => {
      const tsDate = new Date(ts.date);

      return tsDate >= monday && tsDate <= friday;
    });

    setTimesheets(showAll ? allData : weekData);

    setLoading(false);
  }, [employeeId, showAll]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const statusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: "badge-pending",
      approved: "badge-approved",
      rejected: "badge-rejected",
    };

    return (
      <span className={classes[status] || "badge-pending"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />

            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Entries
        </h2>

        <button
          onClick={fetchTimesheets}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {timesheets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>

          <p className="text-sm">
            No timesheets submitted yet.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 pb-3">
                    Date
                  </th>

                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 pb-3">
                    Project
                  </th>

                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-3 pb-3 hidden sm:table-cell">
                    Task
                  </th>

                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-3 pb-3">
                    Hours
                  </th>

                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 pb-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {timesheets.map((ts) => (
                  <tr
                    key={ts.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 whitespace-nowrap text-gray-700">
                      {new Date(ts.date).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-700">
                      {ts.project?.name || "-"}
                    </td>

                    <td className="px-3 py-3 text-gray-500 hidden sm:table-cell">
                      {ts.task?.name || "-"}
                    </td>

                    <td className="px-3 py-3 text-right font-medium text-gray-900">
                      {ts.hours}h
                    </td>

                    <td className="px-6 py-3 text-center">
                      {statusBadge(ts.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ CENTER BUTTON BELOW TABLE */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              {showAll
                ? "Show This Week Only"
                : "Show All Entries"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}