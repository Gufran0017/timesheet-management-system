// import { createClient } from "@/lib/supabase/server";
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   const { searchParams, origin } = new URL(request.url);
//   const code = searchParams.get("code");
//   const next = searchParams.get("next") ?? "/dashboard";

//   if (code) {
//     const supabase = await createClient();
//     const { data, error } = await supabase.auth.exchangeCodeForSession(code);

//     console.log("AUTH DATA:", data);    // Added
//     console.log("AUTH ERROR:", error);

//     if (error) {
//       return NextResponse.redirect(`${origin}/auth/login?error=${error.message}`);
//     }

//     if (!error && data.user) {
      
//       // Upsert profile from OAuth token data
//       const user = data.user;
//       const name =
//         user.user_metadata?.full_name ||
//         user.user_metadata?.name ||
//         user.email?.split("@")[0] ||
//         "Unknown";
//       const email = user.email || "";

//       // Generate employee code from email prefix
//       const emailPrefix = email.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
//       const employeeCode = emailPrefix.slice(0, 8);

//       const forwardedHost = request.headers.get("x-forwarded-host");
//       const isLocalEnv = process.env.NODE_ENV === "development";

//       if (isLocalEnv) {
//         return NextResponse.redirect(`${origin}${next}`);
//       } else if (forwardedHost) {
//         return NextResponse.redirect(`https://${forwardedHost}${next}`);
//       } else {
//         return NextResponse.redirect(`${origin}${next}`);
//       }
//     }
//   }

//   return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
// }








import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("AUTH DATA:", data);
    console.log("AUTH ERROR:", error);

    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
      );
    }

    if (data?.user) {
      const user = data.user;

      // Build profile data from Microsoft login
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Unknown";

      const email = user.email || "";

      const emailPrefix = email
        .split("@")[0]
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

      // const employeeCode = emailPrefix.slice(0, 8);

      // Create/update profile in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email,
            name,
            // employee_code: employeeCode,
            // role: "employee",
          },
          {
            onConflict: "id",
          }
        );

      console.log("PROFILE ERROR:", profileError);

      if (profileError) {
        console.log(profileError);
        return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(profileError.message)}`
        );
      }

      // Redirect after login
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      if (forwardedHost) {
        return NextResponse.redirect(
          `https://${forwardedHost}${next}`
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_failed`
  );
}




















