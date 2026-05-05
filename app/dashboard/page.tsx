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

      {/* FULL WIDTH + RESPONSIVE PADDING */}
      <main className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 sm:py-8">

        {/* HEADER */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            My Timesheets
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Submit and track your work hours
          </p>
        </div>

        {/* STACKED LAYOUT (NO GRID SPLIT) */}
        <div className="flex flex-col gap-6 sm:gap-8 w-full">

          {/* FORM (FULL WIDTH ALWAYS) */}
          <div className="w-full">
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 lg:p-8 w-full">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                New Entry
              </h2>

              <TimesheetForm profile={profile} />
            </div>
          </div>

          {/* RECENT ENTRIES BELOW */}
          <div className="w-full">
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 lg:p-8 w-full">
              <DashboardTimesheets employeeId={user.id} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}