import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          {/* Email Icon */}
          <div className="mx-auto h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-12 w-12 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Check your email
          </h1>

          <p className="text-gray-600 mb-6">
            A sign in link has been sent to your email address.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Next steps:
            </h3>
            <ol className="text-left text-sm text-gray-600 space-y-2">
              <li>1. Check your email inbox (and spam folder)</li>
              <li>2. Click the magic link in the email</li>
              <li>3. You'll be signed in automatically</li>
            </ol>
          </div>

          <div className="text-sm text-gray-500">
            <p className="mb-4">
              The link will expire in 24 hours for security reasons.
            </p>
            <p>
              Didn't receive the email?{" "}
              <Link
                href="/auth/signin"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Try again
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}