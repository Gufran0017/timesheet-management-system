"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TeamWeekDetail({ employeeId, week }: any) {
  const supabase = createClient();

  const [data, setData] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    status: "",
  });

  useEffect(() => {
    if (!week) return;
    fetchData();
    fetchEmployee();
  }, [week, filters]);

  const fetchEmployee = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("name, employee_code")
      .eq("id", employeeId)
      .single();

    setEmployee(data);
  };

  const fetchData = async () => {
    setLoading(true);

    let query = supabase
      .from("timesheets")
      .select(`
        *,
        project:projects(name),
        task:tasks(name)
      `)
      .eq("employee_id", employeeId)
      .order("date", { ascending: false });

    const hasFilters =
      filters.dateFrom ||
      filters.dateTo ||
      filters.status;

    // ✅ DEFAULT VIEW → ONLY MONDAY TO FRIDAY
    if (!hasFilters && week) {
      const today = new Date();

      // get Monday of current week
      const day = today.getDay();
      const diff = today.getDate() - ((day + 6) % 7);

      const monday = new Date(today);
      monday.setDate(diff);

      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);

      const mondayStr = monday.toISOString().split("T")[0];
      const fridayStr = friday.toISOString().split("T")[0];

      query = query
        .gte("date", mondayStr)
        .lte("date", fridayStr);
    }

    // ✅ APPLY FILTERS NORMALLY
    if (filters.dateFrom) {
      query = query.gte("date", filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte("date", filters.dateTo);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    const { data } = await query;

    setData(data || []);
    setLoading(false);
  };

  const handleAction = async (
    id: string,
    action: "approved" | "rejected"
  ) => {
    setActionLoading(id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("timesheets")
      .update({
        status: action,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    setData((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: action } : t))
    );

    setActionLoading(null);
  };

  const statusBadge = (status: string) => {
    const styles: any = {
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      pending: "bg-yellow-100 text-yellow-700",
    };

    const formattedStatus =
      status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <span
        className={`px-3 py-1 text-xs rounded-full font-medium ${styles[status]}`}
      >
        {formattedStatus}
      </span>
    );
  };

  const exportCSV = () => {
    const headers = [
      "Date",
      "Project",
      "Task",
      "Hours",
      "Notes",
      "Status",
    ];

    const rows = data.map((ts: any) => [
      ts.date,
      ts.project?.name || "",
      ts.task?.name || "",
      ts.hours,
      ts.notes || "",
      ts.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((item) => `"${String(item).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      `${employee?.name || "employee"}-timesheet.csv`
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          <span className="text-blue-600">
            {employee?.name || "Employee"}
          </span>
          's Timesheet
        </h1>
        <p className="text-gray-500 text-sm">
          Code: {employee?.employee_code || "-"}
        </p>
      </div>

      {/* FILTERS CARD */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Filters
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

          <div>
            <label className="label">From Date</label>
            <input
              type="date"
              className="input-field"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateFrom: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              className="input-field"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateTo: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

        </div>
      </div>

      {/* TABLE CARD */}
      <div className="card">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            {data.length} entries
          </h2>

          <button
            onClick={exportCSV}
            className="btn-secondary text-sm px-4 py-2"
          >
            Export CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-gray-400">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No entries found
          </div>
        ) : (
          <div className="overflow-y-auto overflow-x-auto max-h-[550px] -mx-6">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-100">
                  {[
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
                      className="text-left text-xs font-medium text-gray-500 uppercase px-4 pb-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {data.map((ts) => (
                  <tr key={ts.id} className="hover:bg-gray-50">

                    <td className="px-4 py-3">
                      {new Date(ts.date).toLocaleDateString("en-GB")}
                    </td>

                    <td className="px-4 py-3">
                      {ts.project?.name}
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {ts.task?.name}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {ts.hours}h
                    </td>

                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">
                      {ts.notes}
                    </td>

                    <td className="px-4 py-3">
                      {statusBadge(ts.status)}
                    </td>

                    <td className="px-4 py-3">
                      {ts.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleAction(ts.id, "approved")
                            }
                            disabled={actionLoading === ts.id}
                            className="text-xs btn-success px-2 py-1"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              handleAction(ts.id, "rejected")
                            }
                            disabled={actionLoading === ts.id}
                            className="text-xs btn-danger px-2 py-1"
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







































// "use client";

// import { useEffect, useState } from "react";
// import { createClient } from "@/lib/supabase/client";

// export default function TeamWeekDetail({ employeeId, week }: any) {
//   const supabase = createClient();

//   const [data, setData] = useState<any[]>([]);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [status, setStatus] = useState("");

//   useEffect(() => {
//     if (week) fetchData();
//   }, [week, status]);

//   const fetchData = async () => {
//     if (!week) return;

//     const start = new Date(week);
//     const end = new Date(start);
//     end.setDate(start.getDate() + 6);

//     let query = supabase
//       .from("timesheets")
//       .select(`
//         *,
//         project:projects(name),
//         task:tasks(name)
//       `)
//       .eq("employee_id", employeeId)
//       .gte("date", start.toISOString())
//       .lte("date", end.toISOString());

//     if (fromDate) query = query.gte("date", fromDate);
//     if (toDate) query = query.lte("date", toDate);
//     if (status) query = query.eq("status", status);

//     const { data } = await query.order("date", { ascending: false });

//     setData(data || []);
//   };

//   const updateStatus = async (id: string, newStatus: string) => {
//     await supabase
//       .from("timesheets")
//       .update({ status: newStatus })
//       .eq("id", id);

//     fetchData();
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-6">

//       {/* HEADER */}
//       <div className="mb-6">
//         <h2 className="text-2xl font-semibold text-gray-900">
//           Weekly Entries
//         </h2>
//         <p className="text-sm text-gray-500">
//           Manage employee submissions
//         </p>
//       </div>

//       {/* FILTERS */}
//       <div className="bg-white p-4 rounded-xl shadow mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
//         <input
//           type="date"
//           className="border rounded-lg px-3 py-2 text-sm"
//           value={fromDate}
//           onChange={(e) => setFromDate(e.target.value)}
//         />

//         <input
//           type="date"
//           className="border rounded-lg px-3 py-2 text-sm"
//           value={toDate}
//           onChange={(e) => setToDate(e.target.value)}
//         />

//         <select
//           className="border rounded-lg px-3 py-2 text-sm"
//           value={status}
//           onChange={(e) => setStatus(e.target.value)}
//         >
//           <option value="">All Status</option>
//           <option value="pending">Pending</option>
//           <option value="approved">Approved</option>
//           <option value="rejected">Rejected</option>
//         </select>

//         <button
//           onClick={fetchData}
//           className="bg-blue-600 text-white rounded-lg text-sm py-2 hover:bg-blue-700 transition"
//         >
//           Apply Filters
//         </button>
//       </div>

//       {/* TABLE */}
//       <div className="bg-white shadow rounded-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">

//             <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
//               <tr>
//                 <th className="px-6 py-3 text-left">Date</th>
//                 <th className="px-6 py-3 text-left">Project</th>
//                 <th className="px-6 py-3 text-left">Task</th>
//                 <th className="px-6 py-3 text-left">Hours</th>
//                 <th className="px-6 py-3 text-left">Notes</th>
//                 <th className="px-6 py-3 text-center">Status</th>
//                 <th className="px-6 py-3 text-center">Actions</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y">
//               {data.map((ts) => (
//                 <tr key={ts.id} className="hover:bg-gray-50">

//                   <td className="px-6 py-4">
//                     {new Date(ts.date).toLocaleDateString("en-GB")}
//                   </td>

//                   <td className="px-6 py-4">{ts.project?.name}</td>
//                   <td className="px-6 py-4">{ts.task?.name}</td>

//                   <td className="px-6 py-4 font-semibold">
//                     {ts.hours}h
//                   </td>

//                   <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
//                     {ts.notes || "-"}
//                   </td>

//                   {/* STATUS */}
//                   <td className="px-6 py-4 text-center">
//                     <span
//                       className={`px-3 py-1 text-xs rounded-full font-medium ${
//                         ts.status === "approved"
//                           ? "bg-green-100 text-green-700"
//                           : ts.status === "rejected"
//                           ? "bg-red-100 text-red-700"
//                           : "bg-yellow-100 text-yellow-700"
//                       }`}
//                     >
//                       {ts.status}
//                     </span>
//                   </td>

//                   {/* ACTIONS */}
//                   <td className="px-6 py-4">
//                     <div className="flex justify-center gap-2">

//                       {ts.status === "pending" && (
//                         <>
//                           <button
//                             onClick={() => updateStatus(ts.id, "approved")}
//                             className="min-w-[80px] px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition"
//                           >
//                             Approve
//                           </button>

//                           <button
//                             onClick={() => updateStatus(ts.id, "rejected")}
//                             className="min-w-[80px] px-3 py-1 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition"
//                           >
//                             Reject
//                           </button>
//                         </>
//                       )}

//                       {ts.status === "approved" && (
//                         <button
//                           onClick={() => updateStatus(ts.id, "rejected")}
//                           className="min-w-[80px] px-3 py-1 text-xs font-medium border border-red-500 text-red-600 rounded-md hover:bg-red-50 transition"
//                         >
//                           Reject
//                         </button>
//                       )}

//                       {ts.status === "rejected" && (
//                         <button
//                           onClick={() => updateStatus(ts.id, "approved")}
//                           className="min-w-[80px] px-3 py-1 text-xs font-medium border border-green-500 text-green-600 rounded-md hover:bg-green-50 transition"
//                         >
//                           Approve
//                         </button>
//                       )}

//                     </div>
//                   </td>

//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {data.length === 0 && (
//           <div className="text-center py-10 text-gray-500">
//             No entries found
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }