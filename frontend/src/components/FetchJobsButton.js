import React, { useState } from "react";
import { Button, useNotify, useRefresh } from "react-admin";
import { CircularProgress } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

const FetchJobsButton = () => {
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const refresh = useRefresh();

  const handleClick = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5050/api/jobs/fetch", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        notify(`Successfully fetched ${result.totalFetched} jobs `, {
          type: "success",
        });
      } else {
        throw new Error(result.error || "Failed to fetch jobs");
      }

      refresh();
    } catch (error) {
      console.error("Error fetching jobs:", error);
      notify("Error fetching jobs", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      label={loading ? "Fetching..." : "Fetch New Jobs"}
      disabled={loading}
      icon={loading ? <CircularProgress size={18} /> : <RefreshIcon />}
    />
  );
};

export default FetchJobsButton;
