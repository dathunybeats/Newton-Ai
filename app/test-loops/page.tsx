"use client";

import { useState } from "react";

export default function TestLoopsPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendTestEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/loops/send-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName,
          userId: 'test-user-123',
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to send email', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Test Loops Email</h1>
        <p className="text-gray-600 mb-6">Send a test welcome email using Loops</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name (Optional)
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="John"
            />
          </div>

          <button
            onClick={sendTestEmail}
            disabled={loading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Send Test Welcome Email'}
          </button>
        </div>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <h3 className={`font-semibold mb-2 ${result.error ? 'text-red-900' : 'text-green-900'}`}>
              {result.error ? '❌ Error' : '✅ Success'}
            </h3>
            <pre className={`text-sm overflow-auto ${result.error ? 'text-red-700' : 'text-green-700'}`}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">📋 Setup Checklist:</h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Sign up at <a href="https://loops.so" target="_blank" rel="noopener noreferrer" className="underline font-medium">loops.so</a></li>
              <li>Get your API key from Settings → API Keys</li>
              <li>Add to .env.local: <code className="bg-blue-100 px-1 rounded">LOOPS_API_KEY=your_key</code></li>
              <li>✅ Welcome email created with ID: <code className="bg-blue-100 px-1 rounded">cmighgw3rkfsczq0i6fqz3tat</code></li>
              <li>✅ Data variable added: <code className="bg-blue-100 px-1 rounded">firstName</code></li>
              <li>Make sure the email is Published in Loops</li>
              <li>Restart your dev server</li>
              <li>Test sending!</li>
            </ol>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">📧 Email Templates to Create in Loops:</h3>
            <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
              <li><strong>welcome-email</strong> - Sent when users sign up</li>
              <li><strong>payment-confirmation</strong> - Sent when users subscribe</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
