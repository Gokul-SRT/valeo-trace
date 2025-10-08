 import React from "react";

export default function ProtectedRoute({ children }) {
  // No login check, always allow access
  return children;
}