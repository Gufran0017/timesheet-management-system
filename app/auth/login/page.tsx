"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email profile openid",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheet App</h1>
          <p className="text-gray-500 mt-1">Track your work hours efficiently</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleMicrosoftLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 23 23" className="w-5 h-5" fill="none">
              <path fill="#f3f3f3" d="M0 0h23v23H0z" />
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
          )}
          {loading ? "Signing in..." : "Sign in with Microsoft"}
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sign in with your company Microsoft account
        </p>
      </div>
    </div>
  );
}

















































// <---------------------------------------------------------------------------------->

// -------------- For Testing the code with Email Magic Link----------------

// <---------------------------------------------------------------------------------->


// "use client";

// import { createClient } from "@/lib/supabase/client";
// import { useState } from "react";

// export default function LoginPage() {
//   const supabase = createClient();

//   const [email,setEmail] = useState("");
//   const [message,setMessage] = useState("");
//   const [loading,setLoading] = useState(false);

//   const handleLogin = async () => {
//     setLoading(true);

//     const { error } = await supabase.auth.signInWithOtp({
//       email,
//       options: {
//         shouldCreateUser: true,
//         emailRedirectTo: "http://localhost:3000/auth/callback",
//       },
//     });

//     if (error) {
//       setMessage(error.message);
//     } else {
//       setMessage("Check your email for login link.");
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="card w-full max-w-md">
//         <h1 className="text-2xl font-bold mb-6">
//           Test Login
//         </h1>

//         <input
//           type="email"
//           value={email}
//           onChange={(e)=>setEmail(e.target.value)}
//           placeholder="Enter email"
//           className="input-field mb-4"
//         />

//         <button
//           onClick={handleLogin}
//           disabled={loading}
//           className="btn-primary w-full"
//         >
//           {loading ? "Sending..." : "Send Magic Link"}
//         </button>

//         {message && (
//           <p className="mt-4 text-sm">
//             {message}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }

























