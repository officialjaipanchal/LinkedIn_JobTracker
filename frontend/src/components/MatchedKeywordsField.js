import React, { useState, useEffect } from "react";
import { useRecordContext } from "react-admin";
import { Box, Chip, Typography, Zoom, Fade } from "@mui/material";
import { LocalOffer as TagIcon } from "@mui/icons-material";

export const MatchedKeywordsField = () => {
  const record = useRecordContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!record || !record.matchedKeywords) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="subtitle1"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
          color: "text.primary",
          fontWeight: 500,
        }}
      >
        <TagIcon color="primary" /> Matched Keywords
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          minHeight: "50px",
        }}
      >
        {record.matchedKeywords.map((keyword, index) => (
          <Fade
            key={keyword}
            in={mounted}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <Chip
              label={keyword}
              sx={{
                backgroundColor: "#E3F2FD",
                color: "#1976D2",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: "#BBDEFB",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            />
          </Fade>
        ))}
      </Box>
    </Box>
  );
};
