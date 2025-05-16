import React from "react";
import { Button } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export const JobLinkButton = ({ record }) => {
  if (!record || !record.url) return null;

  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<OpenInNewIcon />}
      href={record.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        textTransform: "none",
        borderColor: "#1976D2",
        color: "#1976D2",
      }}
    >
      View Job
    </Button>
  );
}; 