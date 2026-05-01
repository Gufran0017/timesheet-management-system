"use client";

import { createClient } from "@/lib/supabase/client";
import { Profile, Project, Task, Timesheet } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

type Tab = "users" | "projects" | "tasks" | "timesheets";

interface AdminPanelProps {
  currentUserId: string;
}

export default function AdminPanel({ currentUserId }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "users", label: "Users", icon: "👥" },
    { id: "projects", label: "Projects", icon: "📁" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "timesheets", label: "Timesheets", icon: "📋" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "users" && (
        <UsersTab currentUserId={currentUserId} />
      )}
      {activeTab === "projects" && <ProjectsTab />}
      {activeTab === "tasks" && <TasksTab />}
      {activeTab === "timesheets" && <TimesheetsTab />}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ currentUserId }: { currentUserId: string }) {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("name");
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateRole = async (userId: string, role: string) => {
    setSaving(userId + "-role");
    await supabase.from("profiles").update({ role }).eq("id", userId);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: role as Profile["role"] } : u
      )
    );
    setSaving(null);
  };

  const updateManager = async (userId: string, manager_id: string) => {
    setSaving(userId + "-mgr");
    const value = manager_id === "" ? null : manager_id;
    await supabase.from("profiles").update({ manager_id: value }).eq("id", userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, manager_id: value } : u))
    );
    setSaving(null);
  };

  const managers = users.filter(
    (u) => u.role === "manager" || u.role === "admin"
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="card overflow-hidden">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        User Management ({users.length} users)
      </h2>
      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Name", "Email", "Code", "Role", "Manager"].map((h) => (
                <th
                  key={h}
                  className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pb-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium text-xs">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">
                      {user.name}
                    </span>
                    {user.id === currentUserId && (
                      <span className="text-xs text-blue-600">(you)</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {user.email}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                  {user.employee_code || "-"}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    disabled={saving === user.id + "-role"}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {user.role === "employee" ? (
                    <select
                      value={user.manager_id || ""}
                      onChange={(e) => updateManager(user.id, e.target.value)}
                      disabled={saving === user.id + "-mgr"}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No manager</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Projects Tab ─────────────────────────────────────────────────────────────

function ProjectsTab() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("name");
    setProjects(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const { data } = await supabase
      .from("projects")
      .insert({ name: newName.trim(), active: true })
      .select()
      .single();
    if (data) setProjects((prev) => [...prev, data]);
    setNewName("");
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    await supabase
      .from("projects")
      .update({ name: editName.trim() })
      .eq("id", editId);
    setProjects((prev) =>
      prev.map((p) => (p.id === editId ? { ...p, name: editName.trim() } : p))
    );
    setEditId(null);
    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("projects").update({ active: !active }).eq("id", id);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !active } : p))
    );
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project? This may affect existing timesheets.")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="card">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Project Management
      </h2>

      {/* Add form */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addProject()}
          placeholder="New project name..."
          className="input-field flex-1"
        />
        <button
          onClick={addProject}
          disabled={saving || !newName.trim()}
          className="btn-primary px-4"
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            {editId === project.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="input-field flex-1 text-sm py-1"
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="btn-primary text-xs py-1 px-3"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="btn-secondary text-xs py-1 px-3"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span
                  className={`flex-1 text-sm font-medium ${project.active ? "text-gray-900" : "text-gray-400 line-through"
                    }`}
                >
                  {project.name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${project.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                    }`}
                >
                  {project.active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => {
                    setEditId(project.id);
                    setEditName(project.name);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(project.id, project.active)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  {project.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterProject, setFilterProject] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: tasksData }, { data: projectsData }] = await Promise.all([
      supabase
        .from("tasks")
        .select("*, project:projects(id, name, active, created_at)")
        .order("name"),
      supabase.from("projects").select("*").eq("active", true).order("name"),
    ]);
    setTasks(tasksData || []);
    setProjects(projectsData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTask = async () => {
    if (!newName.trim() || !newProjectId) return;
    setSaving(true);
    const { data } = await supabase
      .from("tasks")
      .insert({ name: newName.trim(), project_id: newProjectId, active: true })
      .select("*, project:projects(id, name, active, created_at)")
      .single();
    if (data) setTasks((prev) => [...prev, data]);
    setNewName("");
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    await supabase.from("tasks").update({ name: editName.trim() }).eq("id", editId);
    setTasks((prev) =>
      prev.map((t) => (t.id === editId ? { ...t, name: editName.trim() } : t))
    );
    setEditId(null);
    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("tasks").update({ active: !active }).eq("id", id);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !active } : t))
    );
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await supabase.from("tasks").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const displayed = filterProject
    ? tasks.filter((t) => t.project_id === filterProject)
    : tasks;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="card">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Task Management
      </h2>

      {/* Add form */}
      <div className="flex gap-2 mb-4">
        <select
          value={newProjectId}
          onChange={(e) => setNewProjectId(e.target.value)}
          className="input-field w-40"
        >
          <option value="">Project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="New task name..."
          className="input-field flex-1"
        />
        <button
          onClick={addTask}
          disabled={saving || !newName.trim() || !newProjectId}
          className="btn-primary px-4"
        >
          Add
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="input-field w-48 text-sm"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {displayed.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            {editId === task.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="input-field flex-1 text-sm py-1"
                  autoFocus
                />
                <button onClick={saveEdit} disabled={saving} className="btn-primary text-xs py-1 px-3">
                  Save
                </button>
                <button onClick={() => setEditId(null)} className="btn-secondary text-xs py-1 px-3">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <span
                    className={`text-sm font-medium ${task.active ? "text-gray-900" : "text-gray-400 line-through"
                      }`}
                  >
                    {task.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    {task.project?.name}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${task.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                    }`}
                >
                  {task.active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => { setEditId(task.id); setEditName(task.name); }}
                  className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(task.id, task.active)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  {task.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
        {displayed.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-6">
            No tasks found.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Timesheets Tab ───────────────────────────────────────────────────────────

function TimesheetsTab() {
  const supabase = createClient();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    project_id: "",
    status: "",
    employee: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("timesheets")
      // .select(
      //   `*, employee:profiles!timesheets_employee_id_fkey(id, name, email, role, manager_id, employee_code, created_at), project:projects(id, name, active, created_at), task:tasks(id, name, project_id, active, created_at)`
      // )
      .select(`
          *,
          employee:profiles (id, name, email, employee_code),
          project:projects (id, name),
          task:tasks (id, name)
        `)
      .order("date", { ascending: false })
      .limit(200);

    if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
    if (filters.dateTo) query = query.lte("date", filters.dateTo);
    if (filters.project_id) query = query.eq("project_id", filters.project_id);
    if (filters.status) query = query.eq("status", filters.status);

    const { data } = await query;
    let results = data || [];

    if (filters.employee) {
      const term = filters.employee.toLowerCase();
      results = results.filter(
        (t) =>
          t.employee?.name?.toLowerCase().includes(term) ||
          t.employee?.email?.toLowerCase().includes(term)
      );
    }

    setTimesheets(results);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from("projects").select("*").eq("active", true).order("name");
      setProjects(data || []);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const exportCSV = () => {
    const headers = ["Employee", "Email", "Code", "Date", "Project", "Task", "Start", "End", "Hours", "Notes", "Status", "Submitted At"];
    const rows = timesheets.map((ts) => [
      ts.employee?.name || "",
      ts.employee?.email || "",
      ts.employee?.employee_code || "",
      ts.date,
      ts.project?.name || "",
      ts.task?.name || "",
      ts.start_time,
      ts.end_time,
      ts.hours,
      ts.notes || "",
      ts.status,
      ts.submitted_at,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-timesheets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Project</label>
            <select
              value={filters.project_id}
              onChange={(e) => setFilters((f) => ({ ...f, project_id: e.target.value }))}
              className="input-field"
            >
              <option value="">All</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="input-field"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="label">Employee</label>
            <input
              type="text"
              value={filters.employee}
              onChange={(e) => setFilters((f) => ({ ...f, employee: e.target.value }))}
              placeholder="Search..."
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            {timesheets.length} entries
          </span>
          <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : timesheets.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400">No results.</p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Employee", "Date", "Project", "Task", "Hours", "Notes", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pb-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {timesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{ts.employee?.name || "-"}</div>
                      <div className="text-xs text-gray-400">{ts.employee?.employee_code}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {new Date(ts.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{ts.project?.name || "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{ts.task?.name || "-"}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{ts.hours}h</td>
                    <td className="px-4 py-3 max-w-[120px]">
                      <p className="truncate text-gray-500 text-xs" title={ts.notes || ""}>{ts.notes || "-"}</p>
                    </td>
                    <td className="px-4 py-3">{statusBadge(ts.status)}</td>
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

// ─── Shared ───────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="card flex items-center justify-center py-12">
      <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
