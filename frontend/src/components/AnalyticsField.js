import React, { useState, useEffect } from "react";
import { useRecordContext } from "react-admin";
import { Box, Typography, LinearProgress } from "@mui/material";
import { TrendingUp, TrendingDown, TrendingFlat } from "@mui/icons-material";

export const AnalyticsField = () => {
  const record = useRecordContext();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!record) return null;

  const getTrendColor = (trend) => {
    if (trend > 0) return "#4CAF50";
    if (trend < 0) return "#F44336";
    return "#757575";
  };

  const TrendIcon = ({ trend }) => {
    if (trend > 0) return <TrendingUp sx={{ color: "#4CAF50" }} />;
    if (trend < 0) return <TrendingDown sx={{ color: "#F44336" }} />;
    return <TrendingFlat sx={{ color: "#757575" }} />;
  };

  const MetricBox = ({ label, value, trend }) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle1">{label}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" color="primary">
            {value}
          </Typography>
          {trend !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <TrendIcon trend={trend} />
              <Typography variant="body2" sx={{ color: getTrendColor(trend) }}>
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 4,
            backgroundImage: "linear-gradient(45deg, #2196F3 30%, #1976D2 90%)",
          },
        }}
      />
    </Box>
  );

  return (
    <Box>
      <MetricBox
        label="Applications"
        value={record.applicationCount || 0}
        trend={record.applyTrend}
      />
      <MetricBox
        label="Views"
        value={record.views || 0}
        trend={record.viewTrend}
      />
    </Box>
  );
};
