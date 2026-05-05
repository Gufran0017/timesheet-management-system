import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );


        // ✅ STEP 0: CHECK IF USER ALREADY EXISTS
        const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", body.email)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // ✅ Step 1: Create auth user
        const { data: authData, error: authError } =
            await supabase.auth.admin.createUser({
                email: body.email,
                password: "Carvsol@123",
                email_confirm: true,
            });

        if (authError) throw authError;

        const userId = authData.user.id;

        // ✅ Step 2: Insert profile (FIXED)
        const { error: profileError } = await supabase
            .from("profiles")
            .insert({
                id: userId,
                name: body.name,
                email: body.email,
                employee_code: body.employee_code,
                role: body.role,
            });

        if (profileError) throw profileError;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}