import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import TeamWeekDetail from "@/components/TeamWeekDetail";

export default async function Page({ params, searchParams }: any) {

  const { employeeId } = await params;
  const { week } = await searchParams;

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

  // ✅ DEFAULT WEEK (IMPORTANT FIX)
  const currentWeek =
    week || new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={profile} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <TeamWeekDetail
          employeeId={employeeId}
          week={currentWeek}
        />
      </main>
    </div>
  );
}