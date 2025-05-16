import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Alert,
  Tooltip,
  Chip,
  Link,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useNotify } from "react-admin";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import {
  School as SchoolIcon,
  Work as WorkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
];

const ResumeUpload = () => {
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState({
    contactInfo: {
      emails: [],
      phones: [],
      linkedin: [],
      github: [],
      websites: [],
    },
    education: [],
    skills: {
      programmingLanguages: [],
      webTechnologies: [],
      databases: [],
      cloudPlatforms: [],
      tools: [],
      methodologies: [],
    },
    experience: [],
    projects: [],
    keywords: [],
    wordFrequencies: {},
  });
  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResume, setEditingResume] = useState(null);
  const [newResumeName, setNewResumeName] = useState("");
  const notify = useNotify();
  const API_URL =
    process.env.REACT_APP_API_URL || "http://localhost:5050/api/resumes";

  const fetchResumes = useCallback(async () => {
    try {
      console.log("Fetching resumes from:", `${API_URL}/saved-resumes`);
      const response = await fetch(`${API_URL}/saved-resumes`);
      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Received data:", data);

      if (!Array.isArray(data)) {
        console.error("Expected array but got:", data);
        setSavedResumes([]);
        return;
      }
      setSavedResumes(data);
    } catch (error) {
      console.error("Error loading resumes:", error);
      setSavedResumes([]);
      notify("Error loading saved resumes", { type: "error" });
    }
  }, [API_URL, notify]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      console.log("Uploading resume file:", file.name);
      const response = await fetch(`${API_URL}/upload-resume`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Received parsed data:", data);

      if (!data.success) {
        throw new Error(data.error || "Failed to process resume");
      }

      console.log("Setting parsed data:", data.parsedData);
      setParsedData(data.parsedData);
      setOpenDialog(true);
      notify("Resume uploaded successfully", { type: "success" });
    } catch (error) {
      console.error("Error uploading resume:", error);
      notify(error.message || "Error uploading resume", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResume = async () => {
    if (!parsedData) return;

    try {
      const response = await fetch(`${API_URL}/save-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Resume ${new Date().toLocaleString()}`,
          data: parsedData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save resume");
      }

      setOpenDialog(false);
      notify("Resume saved successfully", { type: "success" });
      fetchResumes();
    } catch (error) {
      console.error("Error saving resume:", error);
      notify(error.message || "Error saving resume", { type: "error" });
    }
  };

  const handleDeleteResume = async (id) => {
    try {
      const response = await fetch(`${API_URL}/resume/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete resume");
      }

      // Remove the deleted resume from the local state
      setSavedResumes((prevResumes) =>
        prevResumes.filter((resume) => resume.id !== id)
      );

      // If the deleted resume was selected, clear the selection
      if (selectedResume === id) {
        setSelectedResume(null);
        setParsedData(null);
      }

      notify("Resume deleted successfully", { type: "success" });
    } catch (error) {
      console.error("Error deleting resume:", error);
      notify(error.message || "Error deleting resume", { type: "error" });
    }
  };

  const handleSelectResume = async (id) => {
    try {
      setLoadingResume(true);
      setError(null);
      console.log("Fetching resume with ID:", id);
      const response = await fetch(`${API_URL}/resume/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch resume: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("Received resume data:", responseData);

      if (!responseData || !responseData.data) {
        throw new Error("Invalid resume data received");
      }

      // Ensure the data structure is complete by merging with default structure
      const defaultStructure = {
        contactInfo: {
          emails: [],
          phones: [],
          linkedin: [],
          github: [],
          websites: [],
        },
        education: [],
        skills: {
          programmingLanguages: [],
          webTechnologies: [],
          databases: [],
          cloudPlatforms: [],
          tools: [],
          methodologies: [],
        },
        experience: [],
        projects: [],
        keywords: [],
        wordFrequencies: {},
      };

      // Ensure education is an array
      const receivedEducation = Array.isArray(responseData.data.education)
        ? responseData.data.education
        : [];

      // Process skills data
      const receivedSkills = responseData.data.skills || {};
      const processedSkills = {};

      // Ensure each skill category is an array
      Object.entries(defaultStructure.skills).forEach(([category, _]) => {
        const categorySkills = receivedSkills[category];
        processedSkills[category] = Array.isArray(categorySkills)
          ? categorySkills
              .map((skill) => String(skill || "").trim())
              .filter(Boolean)
          : [];
      });

      // Process experience data
      const receivedExperience = Array.isArray(responseData.data.experience)
        ? responseData.data.experience
        : [];

      const processedExperience = receivedExperience.map((exp) => ({
        title: exp?.title || "",
        level: exp?.level || "",
        dates: Array.isArray(exp?.dates) ? exp.dates : [],
        description: exp?.description || "",
      }));

      // Deep merge the received data with default structure
      const mergedData = {
        ...defaultStructure,
        ...responseData.data,
        contactInfo: {
          ...defaultStructure.contactInfo,
          ...(responseData.data.contactInfo || {}),
        },
        skills: processedSkills,
        education: receivedEducation.map((edu) => ({
          degree: edu?.degree || "",
          field: edu?.field || "",
          institution: edu?.institution || "",
          dates: Array.isArray(edu?.dates) ? edu.dates : [],
        })),
        experience: processedExperience,
      };

      console.log("Final processed data:", mergedData);
      setParsedData(mergedData);
      setSelectedResume(id);
    } catch (error) {
      console.error("Error loading resume:", error);
      setError(error.message || "Error loading resume");
      notify("Error loading resume", { type: "error" });
    } finally {
      setLoadingResume(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        handleFileUpload({ target: { files: [file] } });
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const filteredResumes = savedResumes.filter((resume) =>
    resume.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSkillsChart = () => {
    if (!parsedData?.skills || typeof parsedData.skills !== "object")
      return null;

    // Group skills into categories for better visualization
    const categories = {
      Frontend: ["javascript", "react", "html", "css", "less"],
      Backend: ["python", "java", "php", "node.js", "express", "flask"],
      Cloud: ["aws", "azure", "gcp"],
      DevOps: ["docker", "git"],
      Database: ["sql", "mongodb", "postgresql", "mysql"],
      Other: ["rest"],
    };

    const data = Object.entries(categories).map(
      ([category, categorySkills]) => {
        // Get all skills for this category from parsedData.skills
        const matchingSkills = Object.entries(parsedData.skills || {}).filter(
          ([_, skills]) =>
            Array.isArray(skills) &&
            skills.some((skill) =>
              categorySkills.some((categorySkill) =>
                String(skill)
                  .toLowerCase()
                  .includes(categorySkill.toLowerCase())
              )
            )
        );

        return {
          name: category,
          value: matchingSkills.length,
        };
      }
    );

    return data.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            outerRadius="80%"
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value, name) => [`${value} skills`, name]}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: "20px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    ) : null;
  };

  const renderKeywordFrequencyChart = () => {
    if (!parsedData?.wordFrequencies) return null;

    const data = Object.entries(parsedData.wordFrequencies)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15) // Show top 15 keywords
      .map(([word, count]) => ({
        name: word,
        frequency: count,
      }));

    return (
      <ResponsiveContainer width="100%" height={600}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 14 }}
          />
          <YAxis />
          <RechartsTooltip
            formatter={(value, name) => [`${value} occurrences`, name]}
          />
          <Legend />
          <Bar
            dataKey="frequency"
            fill="#8884d8"
            name="Word Frequency"
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderSkillsRadarChart = () => {
    if (!parsedData?.skills || typeof parsedData.skills !== "object")
      return null;

    // Group skills into categories for radar chart
    const categories = {
      Frontend: ["javascript", "react", "html", "css", "less"],
      Backend: ["python", "java", "php", "node.js", "express", "flask"],
      Cloud: ["aws", "azure", "gcp"],
      DevOps: ["docker", "git"],
      Database: ["sql", "mongodb", "postgresql", "mysql"],
      Other: ["rest"],
    };

    const data = Object.entries(categories).map(
      ([category, categorySkills]) => {
        // Get all skills for this category from parsedData.skills
        const matchingSkills = Object.entries(parsedData.skills || {}).filter(
          ([_, skills]) =>
            Array.isArray(skills) &&
            skills.some((skill) =>
              categorySkills.some((categorySkill) =>
                String(skill)
                  .toLowerCase()
                  .includes(categorySkill.toLowerCase())
              )
            )
        );

        return {
          subject: category,
          A: matchingSkills.length,
          fullMark: Math.max(
            ...Object.values(categories).map((skills) => skills.length)
          ),
        };
      }
    );

    return data.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis
            angle={30}
            domain={[0, Math.max(...data.map((d) => d.fullMark))]}
            tick={{ fontSize: 12 }}
          />
          <Radar
            name="Skills"
            dataKey="A"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: "20px" }}
          />
          <RechartsTooltip
            formatter={(value, name) => [`${value} skills`, name]}
          />
        </RadarChart>
      </ResponsiveContainer>
    ) : null;
  };

  const handleEditClick = (e, resume) => {
    e.stopPropagation();
    setEditingResume(resume);
    setNewResumeName(resume.name);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingResume || !newResumeName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/resume/${editingResume.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newResumeName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update resume name");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update resume name");
      }

      // Update the local state
      setSavedResumes((prevResumes) =>
        prevResumes.map((resume) =>
          resume.id === editingResume.id
            ? { ...resume, name: newResumeName.trim() }
            : resume
        )
      );

      setEditDialogOpen(false);
      setEditingResume(null);
      setNewResumeName("");
      notify("Resume name updated successfully", { type: "success" });
    } catch (error) {
      console.error("Error updating resume name:", error);
      notify(error.message || "Error updating resume name", { type: "error" });
    }
  };

  const renderEducationTimeline = () => {
    if (!parsedData.education || parsedData.education.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No education information found
        </Alert>
      );
    }

    return (
      <Timeline position="alternate">
        {parsedData.education.map((edu, index) => (
          <TimelineItem key={index}>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <SchoolIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Paper elevation={3} sx={{ p: 2, bgcolor: "background.paper" }}>
                <Typography variant="h6" component="h3">
                  {edu.degree} in {edu.field}
                </Typography>
                <Typography>{edu.institution}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {edu.dates?.join(" - ")}
                </Typography>
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    );
  };

  const renderSkillsSection = () => {
    if (
      !parsedData.skills ||
      Object.values(parsedData.skills).every((arr) => arr.length === 0)
    ) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No skills information found
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        {Object.entries(parsedData.skills).map(([category, skills]) => {
          if (skills.length === 0) return null;
          return (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {category.charAt(0).toUpperCase() +
                  category.slice(1).replace(/([A-Z])/g, " $1")}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    color="primary"
                    variant="outlined"
                    sx={{
                      borderRadius: "16px",
                      "&:hover": {
                        backgroundColor: "rgba(25, 118, 210, 0.08)",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderWorkExperience = () => {
    if (!parsedData.experience || parsedData.experience.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No work experience found
        </Alert>
      );
    }

    return (
      <Timeline position="alternate">
        {parsedData.experience.map((exp, index) => (
          <TimelineItem key={index}>
            <TimelineSeparator>
              <TimelineDot color="secondary">
                <WorkIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Paper elevation={3} sx={{ p: 2, bgcolor: "background.paper" }}>
                <Typography variant="h6" component="h3">
                  {exp.title}
                </Typography>
                {exp.level && (
                  <Chip
                    label={exp.level}
                    size="small"
                    color="primary"
                    sx={{ mb: 1 }}
                  />
                )}
                <Typography variant="body2" color="textSecondary">
                  {exp.dates?.join(" - ")}
                </Typography>
                {exp.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {exp.description}
                  </Typography>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: "100vw", overflowX: "hidden" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={12} md={2}>
          <Card sx={{ mb: 2, position: "sticky", top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Resume
              </Typography>
              <Paper
                sx={{
                  p: 3,
                  border: "2px dashed",
                  borderColor: dragActive ? "primary.main" : "grey.300",
                  bgcolor: dragActive ? "action.hover" : "background.paper",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  accept=".pdf"
                  style={{ display: "none" }}
                  id="resume-upload"
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="resume-upload">
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <CloudUploadIcon
                      sx={{ fontSize: 48, color: "primary.main" }}
                    />
                    <Typography variant="body1" align="center">
                      Drag and drop your resume here, or click to browse
                    </Typography>
                    <Button
                      variant="contained"
                      component="span"
                      disabled={loading}
                      startIcon={
                        loading ? <CircularProgress size={20} /> : null
                      }
                    >
                      {loading ? "Uploading..." : "Upload Resume"}
                    </Button>
                  </Box>
                </label>
              </Paper>
            </CardContent>
          </Card>

          <Card sx={{ position: "sticky", top: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Saved Resumes
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
              <List sx={{ maxHeight: "calc(100vh - 500px)", overflow: "auto" }}>
                {filteredResumes.map((resume) => (
                  <ListItem
                    key={resume.id}
                    button
                    selected={selectedResume === resume.id}
                    onClick={() => handleSelectResume(resume.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      "&.Mui-selected": {
                        bgcolor: "primary.light",
                        "&:hover": {
                          bgcolor: "primary.light",
                        },
                      },
                    }}
                  >
                    <ListItemText
                      primary={resume.name}
                      secondary={new Date(
                        resume.createdAt
                      ).toLocaleDateString()}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Edit resume name">
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={(e) => handleEditClick(e, resume)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete resume">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResume(resume.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={12} md={10}>
          {loadingResume ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                minHeight: "400px",
              }}
            >
              <CircularProgress />
            </Box>
          ) : parsedData ? (
            <>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  <Grid container spacing={2}>
                    {parsedData.contactInfo.emails.map((email, index) => (
                      <Grid item key={`email-${index}`}>
                        <Chip
                          icon={<EmailIcon />}
                          label={email}
                          variant="outlined"
                          component="a"
                          href={`mailto:${email}`}
                          clickable
                        />
                      </Grid>
                    ))}
                    {parsedData.contactInfo.phones.map((phone, index) => (
                      <Grid item key={`phone-${index}`}>
                        <Chip
                          icon={<PhoneIcon />}
                          label={phone}
                          variant="outlined"
                        />
                      </Grid>
                    ))}
                    {parsedData.contactInfo.linkedin.map((profile, index) => (
                      <Grid item key={`linkedin-${index}`}>
                        <Chip
                          icon={<LinkedInIcon />}
                          label="LinkedIn Profile"
                          variant="outlined"
                          component="a"
                          href={
                            profile.startsWith("http")
                              ? profile
                              : `https://${profile}`
                          }
                          target="_blank"
                          clickable
                        />
                      </Grid>
                    ))}
                    {parsedData.contactInfo.github.map((profile, index) => (
                      <Grid item key={`github-${index}`}>
                        <Chip
                          icon={<GitHubIcon />}
                          label="GitHub Profile"
                          variant="outlined"
                          component="a"
                          href={
                            profile.startsWith("http")
                              ? profile
                              : `https://${profile}`
                          }
                          target="_blank"
                          clickable
                        />
                      </Grid>
                    ))}
                    {parsedData.contactInfo.websites.map((website, index) => (
                      <Grid item key={`website-${index}`}>
                        <Chip
                          icon={<LanguageIcon />}
                          label="Personal Website"
                          variant="outlined"
                          component="a"
                          href={
                            website.startsWith("http")
                              ? website
                              : `https://${website}`
                          }
                          target="_blank"
                          clickable
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Education
                  </Typography>
                  {renderEducationTimeline()}
                </CardContent>
              </Card>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Skills
                  </Typography>
                  {renderSkillsSection()}
                </CardContent>
              </Card>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Work Experience
                  </Typography>
                  {renderWorkExperience()}
                </CardContent>
              </Card>

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Projects
                  </Typography>
                  <Grid container spacing={2}>
                    {parsedData.projects.map((project, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" component="div">
                              {project.name}
                            </Typography>
                            <Box sx={{ my: 1 }}>
                              {project.technologies.map((tech, techIndex) => (
                                <Chip
                                  key={techIndex}
                                  label={tech}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                            <Typography variant="body2">
                              {project.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Skills Distribution by Category
                      </Typography>
                      <Box
                        sx={{
                          height: "400px",
                          width: "100%",
                          position: "relative",
                          "& .recharts-wrapper": {
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                          },
                        }}
                      >
                        {renderSkillsChart()}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Skills Radar by Category
                      </Typography>
                      <Box
                        sx={{
                          height: "400px",
                          width: "100%",
                          position: "relative",
                          "& .recharts-wrapper": {
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                          },
                        }}
                      >
                        {renderSkillsRadarChart()}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Keyword Frequency
                      </Typography>
                      <Box
                        sx={{
                          height: "400px",
                          width: "100%",
                          minWidth: "800px",
                        }}
                      >
                        {renderKeywordFrequencyChart()}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          ) : (
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "400px",
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  <DescriptionIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No Resume Selected
                  </Typography>
                  <Typography variant="body1">
                    Select a resume from the list to view its analysis
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save Resume Analysis</DialogTitle>
        <DialogContent>
          <Typography>
            Would you like to save this resume analysis for future reference?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveResume}
            startIcon={<SaveIcon />}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Resume Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Resume Name"
            type="text"
            fullWidth
            value={newResumeName}
            onChange={(e) => setNewResumeName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditSave}
            startIcon={<SaveIcon />}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResumeUpload;
