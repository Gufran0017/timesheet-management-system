"use client";

import { useState } from "react";

export default function CreateEmployeeTab() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    employee_code: "",
    role: "employee",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      // ✅ ONLY CALL API (no supabase here)
      const res = await fetch("/api/create-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMsg("✅ Employee created successfully");

      setForm({
        name: "",
        email: "",
        employee_code: "",
        role: "employee",
      });

    } catch (err: any) {
      setMsg("❌ " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="card max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Create New Employee
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Name */}
        <input
          type="text"
          placeholder="Full Name"
          className="input-field w-full"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          required
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="input-field w-full"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          required
        />

        {/* Employee Code */}
        <input
          type="text"
          placeholder="Employee Code"
          className="input-field w-full"
          value={form.employee_code}
          onChange={(e) =>
            setForm({ ...form, employee_code: e.target.value })
          }
        />

        {/* Role */}
        <select
          className="input-field w-full"
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>

        {/* Button */}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Employee"}
        </button>

        {/* Message */}
        {msg && (
          <p className="text-sm text-center mt-2">{msg}</p>
        )}
      </form>
    </div>
  );
}