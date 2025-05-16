import React from "react";

export const EmptyList = () => (
  <div
    style={{
      padding: "40px 20px",
      textAlign: "center",
      color: "#757575",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      margin: "20px 0",
      boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
    }}
  >
    <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>
      📋
    </div>
    <h3 style={{ color: "#424242", marginBottom: "10px" }}>No jobs found</h3>
    <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto" }}>
      Try adjusting your filters or search for different keywords to find more
      job opportunities.
    </p>
  </div>
);
