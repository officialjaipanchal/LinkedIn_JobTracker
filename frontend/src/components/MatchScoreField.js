import React, { useState, useEffect } from "react";
import { useRecordContext, useGetList } from "react-admin";
import {
  Box,
  CircularProgress,
  Typography,
  Tooltip,
  Stack,
} from "@mui/material";
import { WorkHistory as WorkHistoryIcon } from "@mui/icons-material";

export const MatchScoreField = () => {
  const record = useRecordContext();
  const [progress, setProgress] = useState(0);
  const [matchDetails, setMatchDetails] = useState(null);

  // Fetch user's resumes
  const { data: resumes } = useGetList("resumes", {
    pagination: { page: 1, perPage: 10 },
    sort: { field: "lastUpdated", order: "DESC" },
  });

  useEffect(() => {
    if (record && resumes) {
      // Calculate match score for each resume and get the best match
      const bestMatch = calculateBestMatch(record, resumes);
      setMatchDetails(bestMatch);

      const timer = setTimeout(() => {
        setProgress(bestMatch.score);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [record, resumes]);

  const calculateBestMatch = (job, resumes) => {
    if (!resumes || !job) {
      return { score: 0, matchedKeywords: [], resumeId: null };
    }

    let bestMatch = {
      score: 0,
      matchedKeywords: [],
      resumeId: null,
      resumeName: null,
    };

    Object.values(resumes).forEach((resume) => {
      const result = calculateMatchScore(job, resume);
      if (result.score > bestMatch.score) {
        bestMatch = {
          ...result,
          resumeId: resume.id,
          resumeName: resume.name,
        };
      }
    });

    return bestMatch;
  };

  const calculateMatchScore = (job, resume) => {
    const matchedKeywords = [];
    let totalKeywords = 0;
    let matches = 0;

    // Extract keywords from job requirements
    const jobKeywords = [
      ...(job.requirements || []).map((req) => req.toLowerCase()),
      ...(job.description || "").toLowerCase().split(/\W+/),
      ...(job.skills || []).map((skill) => skill.toLowerCase()),
    ].filter((keyword) => keyword.length > 2);

    // Extract keywords from resume
    const resumeContent = [
      ...(resume.skills || []).map((skill) => skill.toLowerCase()),
      ...(resume.experience || []).map((exp) => exp.description.toLowerCase()),
      ...(resume.education || []).map((edu) => edu.description.toLowerCase()),
    ]
      .join(" ")
      .split(/\W+/)
      .filter((word) => word.length > 2);

    // Count unique keywords
    const uniqueJobKeywords = new Set(jobKeywords);
    totalKeywords = uniqueJobKeywords.size;

    // Check matches
    uniqueJobKeywords.forEach((keyword) => {
      if (resumeContent.includes(keyword)) {
        matches++;
        matchedKeywords.push(keyword);
      }
    });

    const score = Math.round((matches / totalKeywords) * 100);

    return {
      score: Math.min(score, 100), // Cap at 100%
      matchedKeywords: matchedKeywords,
    };
  };

  const getColor = (value) => {
    if (value >= 80) return "#4CAF50";
    if (value >= 60) return "#FFC107";
    return "#F44336";
  };

  if (!record) return null;

  return (
    <Box sx={{ position: "relative" }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <CircularProgress
            variant="determinate"
            value={progress}
            size={80}
            thickness={4}
            sx={{
              color: getColor(progress),
              transition: "all 0.3s ease",
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h6"
              component="div"
              color="textSecondary"
              sx={{ fontWeight: "bold" }}
            >
              {progress}%
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {progress >= 80
              ? "Excellent Match"
              : progress >= 60
              ? "Good Match"
              : "Fair Match"}
          </Typography>
          {matchDetails?.resumeName && (
            <Tooltip title="Best matching resume">
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <WorkHistoryIcon fontSize="small" />
                {matchDetails.resumeName}
              </Typography>
            </Tooltip>
          )}
        </Box>
      </Stack>
    </Box>
  );
};
