import React from "react";

export const JobTypeChip = ({ record }) => {
  if (!record) return null;

  const jobTypeColors = {
    "full-time": { bg: "#E8F5E9", text: "#2E7D32", border: "#81C784" },
    "part-time": { bg: "#E3F2FD", text: "#1565C0", border: "#64B5F6" },
    contract: { bg: "#FFF3E0", text: "#E65100", border: "#FFB74D" },
    internship: { bg: "#F3E5F5", text: "#6A1B9A", border: "#BA68C8" },
    remote: { bg: "#E0F7FA", text: "#00838F", border: "#4DD0E1" },
    freelance: { bg: "#FFF8E1", text: "#FF8F00", border: "#FFD54F" },
    temporary: { bg: "#F1F8E9", text: "#558B2F", border: "#AED581" },
  };

  // Default for unknown job types
  const defaultColors = { bg: "#EEEEEE", text: "#616161", border: "#BDBDBD" };

  // Get colors based on job type (case insensitive)
  const jobType = record.jobType ? record.jobType.toLowerCase() : "";
  const colors = jobTypeColors[jobType] || defaultColors;

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          padding: "6px 10px",
          borderRadius: "16px",
          fontSize: "0.8rem",
          fontWeight: "bold",
          display: "inline-flex",
          alignItems: "center",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        {record.jobType || "Unknown"}
      </div>
      {record.isRemote && (
        <div
          style={{
            backgroundColor: "#E0F7FA",
            color: "#00838F",
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: "bold",
            border: "1px solid #80DEEA",
            display: "inline-flex",
            alignItems: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <span style={{ marginRight: "4px" }}>🌐</span>
          Remote
        </div>
      )}
    </div>
  );
};
