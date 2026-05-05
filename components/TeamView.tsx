"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const getWeekStart = (date: string) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - ((day + 6) % 7);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
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
        employee:profiles (id, name, employee_code)
      `)
      .order("date", { ascending: false });

    const grouped: any = {};

    data?.forEach((ts) => {
      const week = getWeekStart(ts.date);
      const key = `${ts.employee_id}-${week}`;

      if (!grouped[key]) {
        grouped[key] = {
          employee: ts.employee,
          week,
          totalHours: 0,
          entries: [],
        };
      }

      grouped[key].totalHours += ts.hours || 0;
      grouped[key].entries.push(ts);
    });

    setGroups(Object.values(grouped));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-gray-500 border-b">
          <tr>
            <th className="text-left py-2">Employee</th>
            <th>Code</th>
            <th>Week</th>
            <th>Total Hours</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {groups.map((g, i) => (
            <tr key={i} className="border-b">
              <td className="py-3">{g.employee?.name}</td>
              <td className="text-center">
                {g.employee?.employee_code}
              </td>
              <td className="text-center">{g.week}</td>
              <td className="text-center">{g.totalHours}h</td>
              <td className="text-center">
                <button
                  onClick={() =>
                    router.push(
                      `/team/${g.employee.id}?week=${g.week}`
                    )
                  }
                  className="text-blue-600 hover:underline"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}