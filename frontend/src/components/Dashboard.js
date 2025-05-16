import React, { useState, useEffect } from "react";
import { useNotify } from "react-admin";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Bookmark as BookmarkIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();
  const theme = useTheme();

  const fetchStats = async () => {
    try {
      setLoading(true);

      // First get the total count
      const countResponse = await fetch("http://localhost:5050/api/jobs/count");
      const { count: totalCount } = await countResponse.json();

      // Then get all jobs for status calculations
      const response = await fetch("http://localhost:5050/api/jobs");
      const jobs = await response.json();

      // Calculate statistics
      const statistics = {
        total: totalCount || jobs.length, // Use the count from server, fallback to length
        available: jobs.filter((job) => job.status === "not_applied").length,
        applied: jobs.filter((job) =>
          ["applied", "interviewing", "offered", "rejected"].includes(
            job.status
          )
        ).length,
        saved: jobs.filter((job) => job.saved).length,
        notInterested: jobs.filter((job) => job.status === "not_interested")
          .length,
        interviewing: jobs.filter((job) => job.status === "interviewing")
          .length,
        offered: jobs.filter((job) => job.status === "offered").length,
        rejected: jobs.filter((job) => job.status === "rejected").length,
      };

      setStats(statistics);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      notify("Error loading dashboard statistics", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: "100%", boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: "12px",
              p: 1,
              mr: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" component="div">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <IconButton onClick={fetchStats} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Main stats */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Jobs"
            value={stats?.available || 0}
            icon={<WorkIcon sx={{ color: theme.palette.primary.main }} />}
            color={theme.palette.primary.main}
            subtitle={`${stats?.total || 0} total jobs tracked`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Applied Jobs"
            value={stats?.applied || 0}
            icon={
              <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
            }
            color={theme.palette.success.main}
            subtitle={`${stats?.interviewing || 0} currently interviewing`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Saved Jobs"
            value={stats?.saved || 0}
            icon={<BookmarkIcon sx={{ color: theme.palette.warning.main }} />}
            color={theme.palette.warning.main}
            subtitle="Jobs marked for later"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Not Interested"
            value={stats?.notInterested || 0}
            icon={<BlockIcon sx={{ color: theme.palette.error.main }} />}
            color={theme.palette.error.main}
            subtitle="Jobs marked as not interested"
          />
        </Grid>

        {/* Application status breakdown */}
        <Grid item xs={12}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Status Breakdown
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="primary">
                      {stats?.interviewing || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Interviewing
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      sx={{ color: theme.palette.success.main }}
                    >
                      {stats?.offered || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Offers Received
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      sx={{ color: theme.palette.error.main }}
                    >
                      {stats?.rejected || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rejected
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      sx={{ color: theme.palette.warning.main }}
                    >
                      {(
                        ((stats?.applied || 0) / (stats?.total || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Application Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
