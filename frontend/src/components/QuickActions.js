import React from "react";
import { Button } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import SendIcon from "@mui/icons-material/Send";

export const QuickActions = ({ record, onSave, onNotInterested, onApply }) => {
  if (!record) return null;

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={record.saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        onClick={() => onSave(record)}
        style={{
          textTransform: "none",
          borderColor: record.saved ? "#FFC107" : "#757575",
          color: record.saved ? "#FFC107" : "#757575",
        }}
      >
        {record.saved ? "Saved" : "Save"}
      </Button>

      <Button
        variant="outlined"
        size="small"
        startIcon={<ThumbDownIcon />}
        onClick={() => onNotInterested(record)}
        style={{
          textTransform: "none",
          borderColor: "#F44336",
          color: "#F44336",
        }}
      >
        Not Interested
      </Button>

      <Button
        variant="contained"
        size="small"
        startIcon={<SendIcon />}
        onClick={() => onApply(record)}
        style={{
          textTransform: "none",
          backgroundColor: "#4CAF50",
          color: "white",
        }}
      >
        Apply
      </Button>
    </div>
  );
};
