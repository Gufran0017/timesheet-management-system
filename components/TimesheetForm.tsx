"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function TimesheetForm({ profile, onSubmitted }: any) {
  const supabase = createClient();

  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    employee_code: profile.employee_code || "",
    date: today,
    project_id: "",
    task_id: "",
    start_time: "",
    end_time: "",
    hours: "",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from("projects").select("*");
      const { data: t } = await supabase.from("tasks").select("*");
      setProjects(p || []);
      setTasks(t || []);
    };
    load();
  }, []);

  const calcHours = (s: string, e: string) => {
    if (!s || !e) return "";
    const diff =
      (new Date(`1970-01-01T${e}`).getTime() -
        new Date(`1970-01-01T${s}`).getTime()) /
      3600000;
    return diff > 0 ? diff.toFixed(2) : "";
  };

  const updateForm = (field: string, value: string) => {
    setForm((p) => {
      const n = { ...p, [field]: value };
      if (field === "start_time" || field === "end_time") {
        n.hours = calcHours(n.start_time, n.end_time);
      }
      return n;
    });
  };

  const updateRow = (i: number, field: string, value: string) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: value };

    if (field === "start_time" || field === "end_time") {
      updated[i].hours = calcHours(
        updated[i].start_time,
        updated[i].end_time
      );
    }

    setRows(updated);
  };

  const fillWeek = () => {
    const base = new Date();
    const day = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - ((day + 6) % 7));

    const week = Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        date: d.toISOString().split("T")[0],
        project_id: "",
        task_id: "",
        start_time: "",
        end_time: "",
        hours: "",
        notes: "",
      };
    });

    setRows(week);
  };

  const submitSingle = async () => {
    setSubmitting(true);

    const { error } = await supabase.from("timesheets").insert({
      ...form,
      employee_id: profile.id,
      hours: parseFloat(form.hours),
      status: "pending",
    });

    setSubmitting(false);

    if (!error) {
      setMessage("✅ Submitted successfully");
      setForm({
        ...form,
        project_id: "",
        task_id: "",
        notes: "",
        hours: "",
      });
      onSubmitted?.();
    }
  };

  const submitBulk = async () => {
    const valid = rows.filter(
      (r) => r.project_id && r.task_id && r.hours
    );

    if (!valid.length) return;

    setSubmitting(true);

    const payload = valid.map((r) => ({
      ...r,
      employee_id: profile.id,
      employee_code: form.employee_code,
      hours: parseFloat(r.hours),
      status: "pending",
    }));

    const { error } = await supabase.from("timesheets").insert(payload);

    setSubmitting(false);

    if (!error) {
      setMessage("✅ Week submitted successfully");
      setRows([]);
      onSubmitted?.();
    }
  };

  return (
    <div className="w-full bg-white p-5 rounded-lg border shadow-sm space-y-5">

      <h2 className="text-base font-semibold">New Entry</h2>

      {message && (
        <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
          {message}
        </div>
      )}

      {/* MODE */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("single")}
          className={`px-3 py-1.5 text-sm rounded border ${mode === "single" ? "bg-blue-600 text-white" : "hover:bg-gray-100"
            }`}
        >
          Single Entry
        </button>

        <button
          onClick={() => setMode("bulk")}
          className={`px-3 py-1.5 text-sm rounded border ${mode === "bulk" ? "bg-blue-600 text-white" : "hover:bg-gray-100"
            }`}
        >
          Weekly Bulk
        </button>
      </div>

      {/* EMP */}
      <div className="grid md:grid-cols-2 gap-3">
        <input value={profile.name} disabled className="input-field text-sm" />
        <input
          value={form.employee_code}
          disabled
          className="input-field text-sm bg-gray-100"
        />
      </div>

      {/* SINGLE */}
      {mode === "single" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-7 gap-3">

          <input type="date" value={form.date}
            onChange={(e) => updateForm("date", e.target.value)}
            className="input-field text-sm" />

          <select value={form.project_id}
            onChange={(e) => updateForm("project_id", e.target.value)}
            className="input-field text-sm">
            <option value="">Project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select value={form.task_id}
            onChange={(e) => updateForm("task_id", e.target.value)}
            className="input-field text-sm">
            <option value="">Task</option>
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <input type="time" value={form.start_time}
            onChange={(e) => updateForm("start_time", e.target.value)}
            className="input-field text-sm" />

          <input type="time" value={form.end_time}
            onChange={(e) => updateForm("end_time", e.target.value)}
            className="input-field text-sm" />

          <input value={form.hours} readOnly
            className="input-field bg-gray-100 text-sm" />

          <input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
            className="input-field text-sm"
          />

          <button
            onClick={submitSingle}
            className="col-span-full w-fit px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}

      {/* BULK */}
      {mode === "bulk" && (
        <div className="space-y-3">

          <div className="flex gap-2">
            <button
              onClick={fillWeek}
              className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
            >
              Fill Mon–Fri
            </button>

            <button
              onClick={() => setRows([...rows, { date: today }])}
              className="px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
            >
              + Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px] space-y-2">

              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-8 gap-2">

                  <input type="date" value={r.date || ""}
                    onChange={(e) => updateRow(i, "date", e.target.value)}
                    className="input-field text-sm" />

                  <select
                    onChange={(e) => updateRow(i, "project_id", e.target.value)}
                    className="input-field text-sm">
                    <option>Project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>

                  <select
                    onChange={(e) => updateRow(i, "task_id", e.target.value)}
                    className="input-field text-sm">
                    <option>Task</option>
                    {tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>

                  <input type="time"
                    onChange={(e) => updateRow(i, "start_time", e.target.value)}
                    className="input-field text-sm" />

                  <input type="time"
                    onChange={(e) => updateRow(i, "end_time", e.target.value)}
                    className="input-field text-sm" />

                  <input value={r.hours || ""} readOnly
                    className="input-field bg-gray-100 text-sm" />

                  <input
                    placeholder="Notes"
                    onChange={(e) => updateRow(i, "notes", e.target.value)}
                    className="input-field text-sm"
                  />

                  <button
                    onClick={() =>
                      setRows(rows.filter((_, idx) => idx !== i))
                    }
                    className="text-red-500 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}

            </div>
          </div>

          <button
            onClick={submitBulk}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {submitting ? "Submitting..." : "Submit Week"}
          </button>
        </div>
      )}
    </div>
  );
}































// "use client";

// import { createClient } from "@/lib/supabase/client";
// import { Profile, Project, Task } from "@/lib/types";
// import { useEffect, useState } from "react";
// interface TimesheetFormProps {
//   profile: Profile;
//   onSubmitted?: () => void;
// }

// export default function TimesheetForm({
//   profile,
//   onSubmitted,
// }: TimesheetFormProps) {

//   const supabase = createClient();

//   const [projects, setProjects] = useState<Project[]>([]);
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

//   const [submitting, setSubmitting] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const today = new Date().toISOString().split("T")[0];

//   const [form, setForm] = useState({
//     employee_code: "",
//     date: today,
//     project_id: "",
//     task_id: "",
//     start_time: "",
//     end_time: "",
//     hours: "",
//     notes: "",
//   });

//   // Load Projects and Tasks
//   useEffect(() => {
//     const fetchData = async () => {

//       const [
//         { data: projectsData, error: projectsError },
//         { data: tasksData, error: tasksError }
//       ] = await Promise.all([
//         supabase
//           .from("projects")
//           .select("*")
//           .eq("active", true)
//           .order("name"),

//         supabase
//           .from("tasks")
//           .select("*")
//           .eq("active", true)
//           .order("name"),
//       ]);

//       // console.log("Projects:", projectsData, projectsError);
//       // console.log("Tasks:", tasksData, tasksError);

//       setProjects(projectsData || []);
//       setTasks(tasksData || []);
//     };

//     fetchData();
//   }, []);

//   // Filter tasks by project
//   useEffect(() => {
//     if (form.project_id) {
//       setFilteredTasks(
//         tasks.filter((t) => t.project_id === form.project_id)
//       );

//       setForm((prev) => ({
//         ...prev,
//         task_id: "",
//       }));
//     } else {
//       setFilteredTasks([]);
//     }
//   }, [form.project_id, tasks]);

//   // Auto calculate hours
//   useEffect(() => {
//     if (form.start_time && form.end_time) {

//       const start = new Date(`1970-01-01T${form.start_time}:00`);
//       const end = new Date(`1970-01-01T${form.end_time}:00`);

//       const diffMs = end.getTime() - start.getTime();

//       if (diffMs > 0) {
//         const hours = (diffMs / 3600000).toFixed(2);

//         setForm((prev) => ({
//           ...prev,
//           hours,
//         }));
//       }
//     }

//   }, [form.start_time, form.end_time]);


//   const handleChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement |
//       HTMLSelectElement |
//       HTMLTextAreaElement
//     >
//   ) => {

//     const { name, value } = e.target;

//     setForm((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };


//   const handleSubmit = async (e: React.FormEvent) => {

//     e.preventDefault();

//     setSubmitting(true);
//     setError(null);
//     setSuccess(false);

//     if (
//       !form.project_id ||
//       !form.task_id ||
//       !form.start_time ||
//       !form.end_time
//     ) {
//       setError("Please fill in all required fields.");
//       setSubmitting(false);
//       return;
//     }

//     const hours = parseFloat(form.hours);

//     if (isNaN(hours) || hours <= 0) {
//       setError("Hours must be positive.");
//       setSubmitting(false);
//       return;
//     }

//     const { error: insertError } =
//       await supabase
//         .from("timesheets")
//         .insert({
//           employee_id: profile.id,
//           employee_code: form.employee_code,
//           date: form.date,
//           project_id: form.project_id,
//           task_id: form.task_id,
//           start_time: form.start_time,
//           end_time: form.end_time,
//           hours,
//           notes: form.notes || null,
//           status: "pending",
//           submitted_at: new Date().toISOString(),
//         });

//     if (insertError) {
//       setError(insertError.message);

//     } else {

//       setSuccess(true);

//       setForm({
//         employee_code: form.employee_code,
//         date: today,
//         project_id: "",
//         task_id: "",
//         start_time: "",
//         end_time: "",
//         hours: "",
//         notes: "",
//       });

//       onSubmitted?.();
//     }

//     setSubmitting(false);
//   };


//   return (
//     <form onSubmit={handleSubmit} className="space-y-5">

//       {error && (
//         <div className="p-3 bg-red-50 border rounded text-red-700 text-sm">
//           {error}
//         </div>
//       )}

//       {success && (
//         <div className="p-3 bg-green-50 border rounded text-green-700 text-sm">
//           Timesheet submitted successfully!
//         </div>
//       )}

//       {/* Employee details */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

//         <div>
//           <label className="label">
//             Employee Name
//           </label>

//           <input
//             type="text"
//             value={profile.name}
//             readOnly
//             className="input-field bg-gray-50"
//           />
//         </div>


//         <div>
//           <label className="label">
//             Employee Code
//           </label>

//           <input
//             type="text"
//             name="employee_code"
//             value={form.employee_code}
//             onChange={handleChange}
//             placeholder="Enter Employee ID"
//             className="input-field"
//           />
//         </div>

//       </div>


//       {/* Date */}
//       <div>
//         <label className="label">
//           Date *
//         </label>

//         <input
//           type="date"
//           name="date"
//           value={form.date}
//           onChange={handleChange}
//           max={today}
//           required
//           className="input-field"
//         />
//       </div>


//       {/* Project and Task */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

//         <div>
//           <label className="label">
//             Project *
//           </label>

//           <select
//             name="project_id"
//             value={form.project_id}
//             onChange={handleChange}
//             required
//             className="input-field"
//           >
//             <option value="">
//               Select project...
//             </option>

//             {projects.map((p) => (
//               <option key={p.id} value={p.id}>
//                 {p.name}
//               </option>
//             ))}

//           </select>
//         </div>


//         <div>
//           <label className="label">
//             Task *
//           </label>

//           <select
//             name="task_id"
//             value={form.task_id}
//             onChange={handleChange}
//             disabled={!form.project_id}
//             required
//             className="input-field"
//           >
//             <option value="">
//               {form.project_id
//                 ? "Select task..."
//                 : "Select project first"}
//             </option>

//             {filteredTasks.map((t:any) => (
//               <option key={t.id} value={t.id}>
//                 {t.name}
//               </option>
//             ))}

//           </select>
//         </div>

//       </div>


//       {/* Time */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

//         <div>
//           <label className="label">
//             Start Time *
//           </label>

//           <input
//             type="time"
//             name="start_time"
//             value={form.start_time}
//             onChange={handleChange}
//             required
//             className="input-field"
//           />
//         </div>


//         <div>
//           <label className="label">
//             End Time *
//           </label>

//           <input
//             type="time"
//             name="end_time"
//             value={form.end_time}
//             onChange={handleChange}
//             required
//             className="input-field"
//           />
//         </div>


//         <div>
//           <label className="label">
//             Hours (auto)
//           </label>

//           <input
//             type="number"
//             name="hours"
//             value={form.hours}
//             onChange={handleChange}
//             className="input-field"
//           />
//         </div>

//       </div>


//       {/* Notes */}
//       <div>

//         <label className="label">
//           Notes
//         </label>

//         <textarea
//           name="notes"
//           value={form.notes}
//           onChange={handleChange}
//           rows={3}
//           className="input-field"
//         />

//       </div>


//       <button
//         type="submit"
//         disabled={submitting}
//         className="btn-primary w-full"
//       >
//         {submitting
//           ? "Submitting..."
//           : "Submit Timesheet"}
//       </button>

//     </form>
//   );
// }


