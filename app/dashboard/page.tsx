import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import TimesheetForm from "@/components/TimesheetForm";
import DashboardTimesheets from "@/components/DashboardTimesheets";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Timesheets</h1>
          <p className="text-gray-500 text-sm mt-1">
            Submit and track your work hours
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Timesheet Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                New Entry
              </h2>
              <TimesheetForm profile={profile} />
            </div>
          </div>

          {/* Past timesheets */}
          <div className="lg:col-span-3">
            <DashboardTimesheets employeeId={user.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
