import React from "react";

const CancelPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">Subscription Cancelled</h1>
        <p className="text-xl text-gray-700 mb-6">
          Your subscription process was cancelled. If this was a mistake, you can try again from your dashboard.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Go to Home Page
        </a>
      </div>
    </div>
  );
};

export default CancelPage; 