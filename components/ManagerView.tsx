"use client";

import { createClient } from "@/lib/supabase/client";
import { Project, Timesheet } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

interface ManagerViewProps {
  managerId: string;
  isAdmin: boolean;
}

export default function ManagerView({ managerId, isAdmin }: ManagerViewProps) {
  const supabase = createClient();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    project_id: "",
    status: "",
  });

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("timesheets")
      // .select(
      //   `*,
      //   employee:profiles!timesheets_employee_id_fkey(id, name, email, role, manager_id, employee_code, created_at),
      //   project:projects(id, name, active, created_at),
      //   task:tasks(id, name, project_id, active, created_at)`
      // )
        .select(`
          *,
          employee:profiles (id, name, email),
          project:projects (id, name),
          task:tasks (id, name)
        `)
      .order("date", { ascending: false });

    // Managers only see their direct reports (RLS handles this too)
    // if (!isAdmin) {
    //   const { data: teamMembers } = await supabase
    //     .from("profiles")
    //     .select("id")
    //     .eq("manager_id", managerId);
    //   const ids = (teamMembers || []).map((m) => m.id);
    //   if (ids.length === 0) {
    //     setTimesheets([]);
    //     setLoading(false);
    //     return;
    //   }
    //   query = query.in("employee_id", ids);
    // }

    if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
    if (filters.dateTo) query = query.lte("date", filters.dateTo);
    if (filters.project_id) query = query.eq("project_id", filters.project_id);
    if (filters.status) query = query.eq("status", filters.status);

    const { data } = await query;
    setTimesheets(data || []);
    setLoading(false);
  }, [managerId, isAdmin, filters]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("active", true)
        .order("name");
      setProjects(data || []);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);


  const handleAction = async (
  id: string,
  action: "approved" | "rejected"
) => {
  console.log("Updating:", id, action);

  setActionLoading(id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("timesheets")
    .update({
      status: action,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(); // ✅ VERY IMPORTANT

  if (error) {
    console.error("Update failed:", error);
    alert(error.message);
    setActionLoading(null);
    return;
  }

  console.log("Update success:", data);

  // ✅ safer UI update (after success)
  setTimesheets((prev) =>
    prev.map((t) => (t.id === id ? { ...t, status: action } : t))
  );

  setActionLoading(null);
};

  // const handleAction = async (
  //   id: string,
  //   action: "approved" | "rejected"
  // ) => {
  //   setActionLoading(id);
  //   const {
  //     data: { user },
  //   } = await supabase.auth.getUser();

  //   await supabase
  //     .from("timesheets")
  //     .update({
  //       status: action,
  //       reviewed_by: user?.id,
  //       reviewed_at: new Date().toISOString(),
  //     })
  //     .eq("id", id);

  //   setTimesheets((prev) =>
  //     prev.map((t) => (t.id === id ? { ...t, status: action } : t))
  //   );
  //   setActionLoading(null);
  // };


  const exportCSV = () => {
    const headers = [
      "Employee Name",
      "Employee Code",
      "Date",
      "Project",
      "Task",
      "Start Time",
      "End Time",
      "Hours",
      "Notes",
      "Status",
    ];

    const rows = timesheets.map((ts) => [
      ts.employee?.name || "",
      ts.employee_code || "",
      ts.date,
      ts.project?.name || "",
      ts.task?.name || "",
      ts.start_time,
      ts.end_time,
      ts.hours,
      ts.notes || "",
      ts.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateFrom: e.target.value }))
              }
              className="input-field"
            />
          </div>
          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateTo: e.target.value }))
              }
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Project</label>
            <select
              value={filters.project_id}
              onChange={(e) =>
                setFilters((f) => ({ ...f, project_id: e.target.value }))
              }
              className="input-field"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="input-field"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            {timesheets.length} entries
          </h2>
          <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </button>
        </div>

        {loading ? (
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
        ) : timesheets.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No timesheets found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Employee",
                    "Date",
                    "Project",
                    "Task",
                    "Hours",
                    "Notes",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pb-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {timesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {ts.employee?.name || "-"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {ts.employee_code}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {new Date(ts.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ts.project?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {ts.task?.name || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {ts.hours}h
                    </td>
                    <td className="px-4 py-3 max-w-[150px]">
                      <p className="truncate text-gray-500" title={ts.notes || ""}>
                        {ts.notes || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{statusBadge(ts.status)}</td>
                    <td className="px-4 py-3">
                      {ts.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAction(ts.id, "approved")}
                            disabled={actionLoading === ts.id}
                            className="text-xs btn-success py-1 px-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(ts.id, "rejected")}
                            disabled={actionLoading === ts.id}
                            className="text-xs btn-danger py-1 px-2"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
