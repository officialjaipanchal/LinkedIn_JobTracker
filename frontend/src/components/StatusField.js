import React from "react";

export const StatusField = ({ record }) => {
  if (!record) return null;

  const statusColors = {
    applied: { bg: "#E3F2FD", text: "#1565C0", border: "#64B5F6" },
    interviewing: { bg: "#FFF3E0", text: "#E65100", border: "#FFB74D" },
    offered: { bg: "#E8F5E9", text: "#2E7D32", border: "#81C784" },
    rejected: { bg: "#FFEBEE", text: "#C62828", border: "#E57373" },
    not_interested: { bg: "#F3E5F5", text: "#6A1B9A", border: "#BA68C8" },
  };

  const status = record.status?.toLowerCase() || "pending";
  const colors = statusColors[status] || {
    bg: "#F5F5F5",
    text: "#757575",
    border: "#BDBDBD",
  };

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        padding: "6px 12px",
        borderRadius: "16px",
        fontSize: "0.875rem",
        fontWeight: "500",
        display: "inline-block",
        textTransform: "capitalize",
      }}
    >
      {status.replace("_", " ")}
    </div>
  );
};
