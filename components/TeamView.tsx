
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const getWeekStart = (date: string) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - ((day + 6) % 7);

  return new Date(d.setDate(diff))
    .toISOString()
    .split("T")[0];
};

export default function TeamView() {
  const supabase = createClient();
  const router = useRouter();

  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from("timesheets")
      .select(`
        employee_id,
        date,
        hours,
        status,
        employee:profiles (
          id,
          name,
          employee_code
        )
      `)
      .order("date", { ascending: false });

    const grouped: any = {};

    data?.forEach((ts) => {

      // ✅ GROUP ONLY BY EMPLOYEE
      const key = ts.employee_id;

      if (!grouped[key]) {
        grouped[key] = {
          employee: ts.employee,
          totalHours: 0,
          latestWeek: getWeekStart(ts.date),
          entries: [],
        };
      }

      // ✅ ONLY COUNT MONDAY-FRIDAY OF CURRENT WEEK
      const entryWeek = getWeekStart(ts.date);
      const latestWeek = grouped[key].latestWeek;

      const day = new Date(ts.date).getDay();

      // Monday = 1
      // Friday = 5
      const isWeekday = day >= 1 && day <= 5;

      if (entryWeek === latestWeek && isWeekday) {
        grouped[key].totalHours += Number(ts.hours || 0);
      }

      // ✅ STORE ENTRIES
      grouped[key].entries.push(ts);

      // ✅ KEEP LATEST WEEK
      if (
        new Date(ts.date) >
        new Date(grouped[key].latestWeek)
      ) {
        grouped[key].latestWeek = getWeekStart(ts.date);
      }
    });

    setGroups(Object.values(grouped));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* HEADER */}
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">
          Team Timesheets
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          View employee weekly timesheet summaries
        </p>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full">

          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>

              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Employee
              </th>

              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Code
              </th>

              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Hours
              </th>

              <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Action
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {groups.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-10 text-gray-400"
                >
                  No team timesheets found
                </td>
              </tr>
            ) : (
              groups.map((g, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 transition"
                >

                  {/* EMPLOYEE */}
                  <td className="px-6 py-5">
                    <div className="font-semibold text-gray-900">
                      {g.employee?.name}
                    </div>
                  </td>

                  {/* CODE */}
                  <td className="px-6 py-5 text-gray-600">
                    {g.employee?.employee_code || "-"}
                  </td>

                  {/* TOTAL HOURS */}
                  <td className="px-6 py-5">
                    <span className="font-semibold text-gray-900">
                      {g.totalHours}h
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="px-6 py-5 text-center">

                    <button
                      onClick={() =>
                        router.push(
                          `/team/${g.employee.id}?week=${g.latestWeek}`
                        )
                      }
                      className="
                        inline-flex
                        items-center
                        justify-center
                        px-4
                        py-2
                        rounded-lg
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        text-sm
                        font-medium
                        transition
                      "
                    >
                      View Timesheet
                    </button>

                  </td>

                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}








































// "use client";

// import { useEffect, useState } from "react";
// import { createClient } from "@/lib/supabase/client";
// import { useRouter } from "next/navigation";

// const getWeekStart = (date: string) => {
//   const d = new Date(date);
//   const day = d.getDay();
//   const diff = d.getDate() - ((day + 6) % 7);
//   return new Date(d.setDate(diff)).toISOString().split("T")[0];
// };

// export default function TeamView() {
//   const supabase = createClient();
//   const router = useRouter();

//   const [groups, setGroups] = useState<any[]>([]);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     const { data } = await supabase
//       .from("timesheets")
//       .select(`
//         employee_id,
//         date,
//         hours,
//         status,
//         employee:profiles (id, name, employee_code)
//       `)
//       .order("date", { ascending: false });

//     const grouped: any = {};

//     data?.forEach((ts) => {
//       const week = getWeekStart(ts.date);
//       const key = `${ts.employee_id}-${week}`;

//       if (!grouped[key]) {
//         grouped[key] = {
//           employee: ts.employee,
//           week,
//           totalHours: 0,
//           entries: [],
//         };
//       }

//       grouped[key].totalHours += ts.hours || 0;
//       grouped[key].entries.push(ts);
//     });

//     setGroups(Object.values(grouped));
//   };

//   return (
//     <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
//       <table className="w-full text-sm">
//         <thead className="text-gray-500 border-b">
//           <tr>
//             <th className="text-left py-2">Employee</th>
//             <th>Code</th>
//             <th>Week</th>
//             <th>Total Hours</th>
//             <th></th>
//           </tr>
//         </thead>

//         <tbody>
//           {groups.map((g, i) => (
//             <tr key={i} className="border-b">
//               <td className="py-3">{g.employee?.name}</td>
//               <td className="text-center">
//                 {g.employee?.employee_code}
//               </td>
//               <td className="text-center">{g.week}</td>
//               <td className="text-center">{g.totalHours}h</td>
//               <td className="text-center">
//                 <button
//                   onClick={() =>
//                     router.push(
//                       `/team/${g.employee.id}?week=${g.week}`
//                     )
//                   }
//                   className="text-blue-600 hover:underline"
//                 >
//                   View
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }