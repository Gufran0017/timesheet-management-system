"use client";

import { createClient } from "@/lib/supabase/client";
import { Profile, Project, Task } from "@/lib/types";
import { useEffect, useState } from "react";

interface TimesheetFormProps {
  profile: Profile;
  onSubmitted?: () => void;
}

export default function TimesheetForm({
  profile,
  onSubmitted,
}: TimesheetFormProps) {

  const supabase = createClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    employee_code: "",
    date: today,
    project_id: "",
    task_id: "",
    start_time: "",
    end_time: "",
    hours: "",
    notes: "",
  });

  // Load Projects and Tasks
  useEffect(() => {
    const fetchData = async () => {

      const [
        { data: projectsData, error: projectsError },
        { data: tasksData, error: tasksError }
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .eq("active", true)
          .order("name"),

        supabase
          .from("tasks")
          .select("*")
          .eq("active", true)
          .order("name"),
      ]);

      // console.log("Projects:", projectsData, projectsError);
      // console.log("Tasks:", tasksData, tasksError);

      setProjects(projectsData || []);
      setTasks(tasksData || []);
    };

    fetchData();
  }, []);

  // Filter tasks by project
  useEffect(() => {
    if (form.project_id) {
      setFilteredTasks(
        tasks.filter((t) => t.project_id === form.project_id)
      );

      setForm((prev) => ({
        ...prev,
        task_id: "",
      }));
    } else {
      setFilteredTasks([]);
    }
  }, [form.project_id, tasks]);

  // Auto calculate hours
  useEffect(() => {
    if (form.start_time && form.end_time) {

      const start = new Date(`1970-01-01T${form.start_time}:00`);
      const end = new Date(`1970-01-01T${form.end_time}:00`);

      const diffMs = end.getTime() - start.getTime();

      if (diffMs > 0) {
        const hours = (diffMs / 3600000).toFixed(2);

        setForm((prev) => ({
          ...prev,
          hours,
        }));
      }
    }

  }, [form.start_time, form.end_time]);


  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    if (
      !form.project_id ||
      !form.task_id ||
      !form.start_time ||
      !form.end_time
    ) {
      setError("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    const hours = parseFloat(form.hours);

    if (isNaN(hours) || hours <= 0) {
      setError("Hours must be positive.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } =
      await supabase
        .from("timesheets")
        .insert({
          employee_id: profile.id,
          employee_code: form.employee_code,
          date: form.date,
          project_id: form.project_id,
          task_id: form.task_id,
          start_time: form.start_time,
          end_time: form.end_time,
          hours,
          notes: form.notes || null,
          status: "pending",
          submitted_at: new Date().toISOString(),
        });

    if (insertError) {
      setError(insertError.message);

    } else {

      setSuccess(true);

      setForm({
        employee_code: form.employee_code,
        date: today,
        project_id: "",
        task_id: "",
        start_time: "",
        end_time: "",
        hours: "",
        notes: "",
      });

      onSubmitted?.();
    }

    setSubmitting(false);
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {error && (
        <div className="p-3 bg-red-50 border rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border rounded text-green-700 text-sm">
          Timesheet submitted successfully!
        </div>
      )}

      {/* Employee details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label className="label">
            Employee Name
          </label>

          <input
            type="text"
            value={profile.name}
            readOnly
            className="input-field bg-gray-50"
          />
        </div>


        <div>
          <label className="label">
            Employee Code
          </label>

          <input
            type="text"
            name="employee_code"
            value={form.employee_code}
            onChange={handleChange}
            placeholder="Enter Employee ID"
            className="input-field"
          />
        </div>

      </div>


      {/* Date */}
      <div>
        <label className="label">
          Date *
        </label>

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          max={today}
          required
          className="input-field"
        />
      </div>


      {/* Project and Task */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label className="label">
            Project *
          </label>

          <select
            name="project_id"
            value={form.project_id}
            onChange={handleChange}
            required
            className="input-field"
          >
            <option value="">
              Select project...
            </option>

            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}

          </select>
        </div>


        <div>
          <label className="label">
            Task *
          </label>

          <select
            name="task_id"
            value={form.task_id}
            onChange={handleChange}
            disabled={!form.project_id}
            required
            className="input-field"
          >
            <option value="">
              {form.project_id
                ? "Select task..."
                : "Select project first"}
            </option>

            {filteredTasks.map((t:any) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}

          </select>
        </div>

      </div>


      {/* Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div>
          <label className="label">
            Start Time *
          </label>

          <input
            type="time"
            name="start_time"
            value={form.start_time}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>


        <div>
          <label className="label">
            End Time *
          </label>

          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={handleChange}
            required
            className="input-field"
          />
        </div>


        <div>
          <label className="label">
            Hours (auto)
          </label>

          <input
            type="number"
            name="hours"
            value={form.hours}
            onChange={handleChange}
            className="input-field"
          />
        </div>

      </div>


      {/* Notes */}
      <div>

        <label className="label">
          Notes
        </label>

        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className="input-field"
        />

      </div>


      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full"
      >
        {submitting
          ? "Submitting..."
          : "Submit Timesheet"}
      </button>

    </form>
  );
}




































































// "use client";

// import { createClient } from "@/lib/supabase/client";
// import { Profile, Project, Task, Timesheet } from "@/lib/types";
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
//     date: today,
//     project_id: "",
//     task_id: "",
//     start_time: "",
//     end_time: "",
//     hours: "",
//     notes: "",
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       const [{ data: projectsData }, { data: tasksData }] = await Promise.all([
//         supabase
//           .from("projects")
//           .select("*")
//           .eq("active", true)
//           .order("name"),
//         supabase
//           .from("tasks")
//           .select("*, project:projects(id, name, active, created_at)")
//           .eq("active", true)
//           .order("name"),
//       ]);
//       setProjects(projectsData || []);
//       setTasks(tasksData || []);
//     };
//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (form.project_id) {
//       setFilteredTasks(
//         tasks.filter((t) => t.project_id === form.project_id)
//       );
//       setForm((prev) => ({ ...prev, task_id: "" }));
//     } else {
//       setFilteredTasks([]);
//     }
//   }, [form.project_id, tasks]);

//   // Auto-calculate hours when start/end time change
//   useEffect(() => {
//     if (form.start_time && form.end_time) {
//       const start = new Date(`1970-01-01T${form.start_time}:00`);
//       const end = new Date(`1970-01-01T${form.end_time}:00`);
//       const diffMs = end.getTime() - start.getTime();
//       if (diffMs > 0) {
//         const hours = (diffMs / 3600000).toFixed(2);
//         setForm((prev) => ({ ...prev, hours }));
//       }
//     }
//   }, [form.start_time, form.end_time]);

//   const handleChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
//     >
//   ) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitting(true);
//     setError(null);
//     setSuccess(false);

//     if (!form.project_id || !form.task_id || !form.start_time || !form.end_time) {
//       setError("Please fill in all required fields.");
//       setSubmitting(false);
//       return;
//     }

//     const hours = parseFloat(form.hours);
//     if (isNaN(hours) || hours <= 0) {
//       setError("Hours must be a positive number.");
//       setSubmitting(false);
//       return;
//     }

//     const { error: insertError } = await supabase.from("timesheets").insert({
//       employee_id: profile.id,
//       date: form.date,
//       project_id: form.project_id,
//       task_id: form.task_id,
//       start_time: form.start_time,
//       end_time: form.end_time,
//       hours,
//       notes: form.notes || null,
//       status: "pending",
//       submitted_at: new Date().toISOString(),
//     });

//     if (insertError) {
//       setError(insertError.message);
//     } else {
//       setSuccess(true);
//       setForm({
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
//         <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
//           {error}
//         </div>
//       )}
//       {success && (
//         <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
//           Timesheet submitted successfully!
//         </div>
//       )}

//       {/* Read-only employee info */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         <div>
//           <label className="label">Employee Name</label>
//           <input
//             type="text"
//             value={profile.name}
//             readOnly
//             className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
//           />
//         </div>
//         <div>
//           <label className="label">Employee Code</label>
//           <input
//             type="text"
//             value={profile.employee_code || "N/A"}
//             readOnly
//             className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
//           />
//         </div>
//       </div>

//       {/* Date */}
//       <div>
//         <label className="label">
//           Date <span className="text-red-500">*</span>
//         </label>
//         <input
//           type="date"
//           name="date"
//           value={form.date}
//           onChange={handleChange}
//           required
//           max={today}
//           className="input-field"
//         />
//       </div>

//       {/* Project & Task */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         <div>
//           <label className="label">
//             Project <span className="text-red-500">*</span>
//           </label>
//           <select
//             name="project_id"
//             value={form.project_id}
//             onChange={handleChange}
//             required
//             className="input-field"
//           >
//             <option value="">Select project...</option>
//             {projects.map((p) => (
//               <option key={p.id} value={p.id}>
//                 {p.name}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="label">
//             Task <span className="text-red-500">*</span>
//           </label>
//           <select
//             name="task_id"
//             value={form.task_id}
//             onChange={handleChange}
//             required
//             disabled={!form.project_id}
//             className="input-field disabled:bg-gray-50 disabled:text-gray-400"
//           >
//             <option value="">
//               {form.project_id ? "Select task..." : "Select a project first"}
//             </option>
//             {filteredTasks.map((t) => (
//               <option key={t.id} value={t.id}>
//                 {t.name}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Time fields */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         <div>
//           <label className="label">
//             Start Time <span className="text-red-500">*</span>
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
//             End Time <span className="text-red-500">*</span>
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
//             Hours{" "}
//             <span className="text-xs text-gray-400 font-normal">
//               (auto-calculated)
//             </span>
//           </label>
//           <input
//             type="number"
//             name="hours"
//             value={form.hours}
//             onChange={handleChange}
//             step="0.01"
//             min="0.01"
//             max="24"
//             placeholder="0.00"
//             className="input-field"
//           />
//         </div>
//       </div>

//       {/* Notes */}
//       <div>
//         <label className="label">Notes</label>
//         <textarea
//           name="notes"
//           value={form.notes}
//           onChange={handleChange}
//           rows={3}
//           placeholder="Optional notes about the work done..."
//           className="input-field resize-none"
//         />
//       </div>

//       <button
//         type="submit"
//         disabled={submitting}
//         className="btn-primary w-full flex items-center justify-center gap-2"
//       >
//         {submitting ? (
//           <>
//             <svg
//               className="animate-spin h-4 w-4"
//               fill="none"
//               viewBox="0 0 24 24"
//             >
//               <circle
//                 className="opacity-25"
//                 cx="12"
//                 cy="12"
//                 r="10"
//                 stroke="currentColor"
//                 strokeWidth="4"
//               />
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//               />
//             </svg>
//             Submitting...
//           </>
//         ) : (
//           "Submit Timesheet"
//         )}
//       </button>
//     </form>
//   );
// }
