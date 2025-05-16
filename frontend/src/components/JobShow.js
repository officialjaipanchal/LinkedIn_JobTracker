import React, { useState } from "react";
import {
  Show,
  useRecordContext,
  useNotify,
  Button,
  useRedirect,
} from "react-admin";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Box,
  IconButton,
  Divider,
  Paper,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AttachMoney as SalaryIcon,
  Link as LinkIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { MatchScoreField } from "./MatchScoreField";
import { MatchedKeywordsField } from "./MatchedKeywordsField";
import { AnalyticsField } from "./AnalyticsField";

// Simplified status badge
const StatusBadge = ({ status }) => {
  const statusConfig = {
    applied: { bg: "#E3F2FD", color: "#1976D2", icon: "✓" },
    interviewing: { bg: "#FFF3E0", color: "#F57C00", icon: "📅" },
    offered: { bg: "#E8F5E9", color: "#2E7D32", icon: "🎉" },
    rejected: { bg: "#FFEBEE", color: "#C62828", icon: "❌" },
    not_interested: { bg: "#F5F5F5", color: "#616161", icon: "⏹️" },
    not_applied: { bg: "#E0E0E0", color: "#424242", icon: "📝" },
  };

  const config = statusConfig[status] || statusConfig.not_applied;

  return (
    <Chip
      label={`${config.icon} ${
        status.charAt(0).toUpperCase() + status.slice(1)
      }`}
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: "bold",
        py: 1,
      }}
    />
  );
};

const JobShowContent = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const redirect = useRedirect();
  const [isSaved, setIsSaved] = useState(record?.saved || false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!record) return null;

  const handleApply = () => {
    if (record.url) {
      window.open(record.url, "_blank");
    } else {
      notify("No application URL available", { type: "warning" });
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    notify(isSaved ? "Job removed from saved jobs" : "Job saved successfully", {
      type: "success",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${record.title} at ${record.company}`,
        text: `Check out this job: ${record.title} at ${record.company}`,
        url: record.url,
      });
    } else {
      navigator.clipboard.writeText(record.url);
      notify("Job URL copied to clipboard", { type: "success" });
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? 2 : 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
        <IconButton onClick={() => redirect("list", "jobs")} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <StatusBadge status={record.status || "not_applied"} />
      </Box>

      {/* Job Title Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              {record.title}
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              <BusinessIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              {record.company}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Typography color="text.secondary">
                <LocationIcon sx={{ mr: 0.5, verticalAlign: "middle" }} />
                {record.location}
              </Typography>
              {record.isRemote && (
                <Chip label="Remote" color="success" size="small" />
              )}
              <Chip
                icon={<CalendarIcon />}
                label={`Posted: ${new Date(
                  record.datePosted
                ).toLocaleDateString()}`}
                size="small"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApply}
                disabled={!record.url}
                startIcon={<LinkIcon />}
              >
                Apply Now
              </Button>
              <IconButton onClick={handleSave} color="primary">
                {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
              <IconButton onClick={handleShare} color="primary">
                <ShareIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Job Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Job Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <WorkIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography>
                      <strong>Type:</strong> {record.jobType}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <SalaryIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography>
                      <strong>Salary:</strong>{" "}
                      {record.salary || "Not specified"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Job Description
              </Typography>
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
              >
                {record.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Match Score */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Match Score
              </Typography>
              <MatchScoreField />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Matched Keywords
              </Typography>
              <MatchedKeywordsField />
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Analytics
              </Typography>
              <AnalyticsField />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const JobShow = () => (
  <Show>
    <JobShowContent />
  </Show>
);

export default JobShow;
