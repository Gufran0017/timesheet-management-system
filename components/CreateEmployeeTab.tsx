"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CreateEmployeeTab() {
  const supabase = createClient();

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
      // 🔐 Step 1: Create Auth user
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: form.email,
          password: "Temp@123", // default password
        });

      if (authError) throw authError;

      const userId = authData.user?.id;

      // 🧾 Step 2: Insert into profiles table
      const { error } = await supabase.from("profiles").insert({
        id: userId,
        name: form.name,
        email: form.email,
        employee_code: form.employee_code,
        role: form.role,
      });

      if (error) throw error;

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

        <input
          type="text"
          placeholder="Employee Code"
          className="input-field w-full"
          value={form.employee_code}
          onChange={(e) =>
            setForm({ ...form, employee_code: e.target.value })
          }
        />

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

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Employee"}
        </button>

        {msg && (
          <p className="text-sm text-center mt-2">{msg}</p>
        )}
      </form>
    </div>
  );
}