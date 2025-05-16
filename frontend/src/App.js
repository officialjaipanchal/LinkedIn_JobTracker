import React, { useState, useCallback, useEffect } from "react";
import {
  Admin,
  Resource,
  List,
  Datagrid,
  TextField,
  DateField,
  useNotify,
  Filter,
  TextInput,
  SelectInput,
  BooleanInput,
  ReferenceInput,
  ChipField,
  NumberField,
  Button,
  ShowButton,
  useRecordContext,
  useUpdate,
  TopToolbar,
  ExportButton,
  BulkDeleteButton,
  BulkUpdateButton,
  TabbedShowLayout,
  Tab,
  useListContext,
  useRefresh,
  useGetList,
  Show,
  SimpleShowLayout,
  RichTextField,
  ArrayField,
  SingleFieldList,
  ReferenceField,
  BooleanField,
  FunctionField,
  DateInput,
} from "react-admin";
import { Chip, useMediaQuery } from "@mui/material";
import { createPortal } from "react-dom";
import { fetchUtils } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";
import FetchJobsButton from "./components/FetchJobsButton";
import ResumeUpload from "./components/ResumeUpload";
import debounce from "lodash/debounce";
import { Link } from "react-router-dom";
import { stringify } from "query-string";
import JobShow from "./components/JobShow";
import LaunchIcon from "@mui/icons-material/Launch";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ShareIcon from "@mui/icons-material/Share";
import InfoIcon from "@mui/icons-material/Info";
import WorkIcon from "@mui/icons-material/Work";
import RefreshIcon from "@mui/icons-material/Refresh";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventIcon from "@mui/icons-material/Event";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import {
  format,
  subDays,
  startOfToday,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";
import CustomLayout from "./components/CustomLayout";
import Dashboard from "./components/Dashboard";

const httpClient = (url, options = {}) => {
  // Encode IDs in URLs
  if (url.includes("/jobs/")) {
    const parts = url.split("/jobs/");
    const id = parts[1].split("?")[0];
    url = `${parts[0]}/jobs/${encodeURIComponent(id)}${
      parts[1].includes("?") ? "?" + parts[1].split("?")[1] : ""
    }`;
  }

  if (!options.headers) {
    options.headers = new Headers({ Accept: "application/json" });
  }
  // Add Content-Type header for PUT requests
  if (options.method === "PUT") {
    options.headers.set("Content-Type", "application/json");
  }

  // Handle special filters for applied jobs
  if (
    url.includes("/applied-jobs") ||
    (url.includes("/jobs") &&
      options.params &&
      options.params.filter &&
      options.params.filter.includes("status_not"))
  ) {
    // Replace with a more direct filter
    url = url.replace("/applied-jobs", "/jobs");
    url = url.replace("status_not", "_status_not"); // Make sure we don't process this twice

    // Add a query param to explicitly filter for applied jobs only
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}appliedOnly=true`;

    console.log("Applied jobs URL modified to:", url);
  }

  return fetchUtils.fetchJson(url, options);
};

// Add this helper function at the top level
const ensureValidDate = (dateValue) => {
  if (!dateValue) return new Date().toISOString();

  try {
    // Handle case where date is an object
    if (typeof dateValue === "object" && dateValue !== null) {
      if (dateValue.$date) {
        dateValue = dateValue.$date;
      } else {
        console.error("Invalid date object:", dateValue);
        return new Date().toISOString();
      }
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.error("Invalid date value:", dateValue);
      return new Date().toISOString();
    }

    return date.toISOString();
  } catch (error) {
    console.error("Error processing date:", error);
    return new Date().toISOString();
  }
};

// Custom data provider with proper PUT handling
const dataProvider = {
  ...simpleRestProvider("http://localhost:5050/api", httpClient),

  // Custom getList for saved-jobs and applied-jobs
  getList: (resource, params) => {
    if (
      resource === "saved-jobs" ||
      resource === "applied-jobs" ||
      resource === "not-interested-jobs"
    ) {
      // Build the filter based on the resource type
      let filter = {};
      if (resource === "saved-jobs") {
        filter = { saved: true };
      } else if (resource === "applied-jobs") {
        filter = {
          status: {
            $in: ["applied", "interviewing", "offered", "rejected"],
          },
        };
      } else if (resource === "not-interested-jobs") {
        filter = { status: "not_interested" };
      }

      // Merge with any additional filters from params
      if (params.filter) {
        filter = { ...filter, ...params.filter };
      }

      // Make the API call to the jobs endpoint with the correct filter
      return httpClient(
        `http://localhost:5050/api/jobs?${stringify({
          filter: JSON.stringify(filter),
          range: JSON.stringify([0, 999]),
          sort: JSON.stringify([
            params.sort?.field || "datePosted",
            params.sort?.order || "DESC",
          ]),
        })}`
      ).then(({ headers, json }) => ({
        data: Array.isArray(json)
          ? json.map((job) => ({
              ...job,
              id: job._id || job.id,
            }))
          : [],
        total: parseInt(headers.get("content-range")?.split("/").pop() || 0),
      }));
    }

    // Default behavior for other resources
    return simpleRestProvider("http://localhost:5050/api", httpClient).getList(
      resource,
      params
    );
  },

  // Custom handlers for other methods
  getOne: (resource, params) => {
    if (
      resource === "saved-jobs" ||
      resource === "applied-jobs" ||
      resource === "not-interested-jobs"
    ) {
      // For special resources, get from the jobs endpoint
      return httpClient(`http://localhost:5050/api/jobs/${params.id}`).then(
        ({ json }) => ({
          data: json,
        })
      );
    }
    return simpleRestProvider("http://localhost:5050/api", httpClient).getOne(
      resource,
      params
    );
  },

  update: async (resource, params) => {
    const url = `http://localhost:5050/api/${
      resource === "saved-jobs" ||
      resource === "applied-jobs" ||
      resource === "not-interested-jobs"
        ? "jobs"
        : resource
    }/${params.id}`;

    // Ensure dates are valid before sending to API
    const processedData = {
      ...params.data,
      datePosted: ensureValidDate(params.data.datePosted),
      lastUpdated: ensureValidDate(params.data.lastUpdated),
      savedAt: params.data.savedAt
        ? ensureValidDate(params.data.savedAt)
        : null,
    };

    console.log("Update URL:", url);
    console.log("Update data:", processedData);

    const { json } = await httpClient(url, {
      method: "PUT",
      body: JSON.stringify(processedData),
    });

    console.log("Update response:", json);

    return {
      data: {
        ...json,
        id: json.id || params.id,
      },
    };
  },
  updateMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map((id) =>
        httpClient(
          `http://localhost:5050/api/${
            resource === "saved-jobs" ||
            resource === "applied-jobs" ||
            resource === "not-interested-jobs"
              ? "jobs"
              : resource
          }/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(params.data),
          }
        )
      )
    );
    return { data: responses.map((response) => response.json) };
  },

  // Add specific methods for delete operations
  delete: (resource, params) => {
    if (resource === "saved-jobs") {
      // For saved-jobs, just update the job to set saved=false
      return httpClient(`http://localhost:5050/api/jobs/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ saved: false, savedAt: null }),
      }).then(({ json }) => ({ data: json }));
    }
    if (resource === "applied-jobs") {
      // For applied-jobs, update the job to reset its status
      return httpClient(`http://localhost:5050/api/jobs/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "not_applied" }),
      }).then(({ json }) => ({ data: json }));
    }
    if (resource === "not-interested-jobs") {
      // For not-interested-jobs, update the job to reset its status
      return httpClient(`http://localhost:5050/api/jobs/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "not_applied" }),
      }).then(({ json }) => ({ data: json }));
    }
    return simpleRestProvider("http://localhost:5050/api", httpClient).delete(
      resource,
      params
    );
  },

  deleteMany: (resource, params) => {
    if (resource === "saved-jobs") {
      // For saved-jobs, just update all jobs to set saved=false
      return Promise.all(
        params.ids.map((id) =>
          httpClient(`http://localhost:5050/api/jobs/${id}`, {
            method: "PUT",
            body: JSON.stringify({ saved: false, savedAt: null }),
          })
        )
      ).then((responses) => ({ data: responses.map(({ json }) => json.id) }));
    }
    if (resource === "applied-jobs" || resource === "not-interested-jobs") {
      // For applied-jobs or not-interested-jobs, update all jobs to reset their status
      return Promise.all(
        params.ids.map((id) =>
          httpClient(`http://localhost:5050/api/jobs/${id}`, {
            method: "PUT",
            body: JSON.stringify({ status: "not_applied" }),
          })
        )
      ).then((responses) => ({ data: responses.map(({ json }) => json.id) }));
    }
    return simpleRestProvider(
      "http://localhost:5050/api",
      httpClient
    ).deleteMany(resource, params);
  },
};

// Custom bulk actions
const JobBulkActions = () => (
  <>
    <BulkUpdateButton
      label="Mark as Applied"
      data={{ status: "applied" }}
      icon={<CheckCircleIcon />}
      sx={{
        ...actionButtonStyles.base,
        ...actionButtonStyles.success,
      }}
    />
    <BulkUpdateButton
      label="Mark as Interviewing"
      data={{ status: "interviewing" }}
      icon={<EventIcon />}
      sx={{
        ...actionButtonStyles.base,
        ...actionButtonStyles.warning,
      }}
    />
    <BulkUpdateButton
      label="Mark as Offered"
      data={{ status: "offered" }}
      icon={<EmojiEventsIcon />}
      sx={{
        ...actionButtonStyles.base,
        ...actionButtonStyles.primary,
      }}
    />
    <BulkUpdateButton
      label="Mark as Rejected"
      data={{ status: "rejected" }}
      icon={<CancelIcon />}
      sx={{
        ...actionButtonStyles.base,
        ...actionButtonStyles.error,
      }}
    />
    <BulkDeleteButton
      icon={<DeleteIcon />}
      sx={{
        ...actionButtonStyles.base,
        ...actionButtonStyles.error,
      }}
    />
  </>
);

// Common button styles for all action buttons
const actionButtonStyles = {
  base: {
    borderRadius: "20px",
    padding: "8px 16px",
    minWidth: "100px",
    height: "36px",
    textTransform: "none",
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
    cursor: "pointer",
    border: "none",
    fontSize: "0.875rem",
    letterSpacing: "0.3px",
    textAlign: "center",
    whiteSpace: "nowrap",
    "& .MuiButton-startIcon, & .MuiButton-endIcon": {
      margin: 0,
    },
    "& .MuiSvgIcon-root": {
      fontSize: "20px",
      transition: "transform 0.2s ease",
      flexShrink: 0,
    },
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      "& .MuiSvgIcon-root": {
        transform: "scale(1.1)",
      },
    },
    "&:active": {
      transform: "translateY(0)",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    },
    "&:disabled": {
      backgroundColor: "#e0e0e0",
      color: "#9e9e9e",
      cursor: "not-allowed",
      transform: "none",
      boxShadow: "none",
      "& .MuiSvgIcon-root": {
        transform: "none",
      },
    },
    // Ensure text is centered when no icon
    "&.MuiButton-text": {
      justifyContent: "center",
    },
    // Center icon with text
    "&.MuiButton-startIcon": {
      justifyContent: "flex-start",
    },
    "&.MuiButton-endIcon": {
      justifyContent: "flex-end",
    },
    // For icon-only buttons
    "&.icon-only": {
      width: "36px",
      minWidth: "36px",
      padding: "8px",
    },
  },
  primary: {
    background: "linear-gradient(45deg, #1976D2 30%, #2196F3 90%)",
    color: "white",
    "&:hover": {
      background: "linear-gradient(45deg, #1565C0 30%, #1976D2 90%)",
    },
  },
  secondary: {
    background: "linear-gradient(45deg, #9C27B0 30%, #BA68C8 90%)",
    color: "white",
    "&:hover": {
      background: "linear-gradient(45deg, #7B1FA2 30%, #9C27B0 90%)",
    },
  },
  success: {
    background: "linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)",
    color: "white",
    "&:hover": {
      background: "linear-gradient(45deg, #1B5E20 30%, #2E7D32 90%)",
    },
  },
  warning: {
    background: "linear-gradient(45deg, #ED6C02 30%, #FF9800 90%)",
    color: "white",
    "&:hover": {
      background: "linear-gradient(45deg, #E65100 30%, #ED6C02 90%)",
    },
  },
  error: {
    background: "linear-gradient(45deg, #D32F2F 30%, #EF5350 90%)",
    color: "white",
    "&:hover": {
      background: "linear-gradient(45deg, #C62828 30%, #D32F2F 90%)",
    },
  },
  info: {
    background: "linear-gradient(45deg, #0288D1 30%, #03A9F4 90%)",
    color: "white",
    "&:hover": {
      background: "linear-gradient(45deg, #01579B 30%, #0288D1 90%)",
    },
  },
};

// Custom list actions with refresh
const ListActions = () => {
  const refresh = useRefresh();
  const notify = useNotify();
  const [updating, setUpdating] = useState(false);

  const handleUpdateAllStatuses = async () => {
    if (updating) return;

    try {
      setUpdating(true);
      console.log("Fixing job statuses...");

      const response = await httpClient(`http://localhost:5050/api/jobs`, {
        method: "GET",
        params: {
          range: JSON.stringify([0, 999]),
          sort: JSON.stringify(["datePosted", "DESC"]),
        },
      });

      const jobsToFix = response.json.filter(
        (job) =>
          !job.status ||
          ![
            "not_applied",
            "applied",
            "interviewing",
            "offered",
            "rejected",
            "not_interested",
          ].includes(job.status)
      );

      if (jobsToFix.length === 0) {
        notify("No jobs need status fixes", { type: "info" });
        setUpdating(false);
        return;
      }

      await Promise.all(
        jobsToFix.map((job) =>
          httpClient(`http://localhost:5050/api/jobs/${job.id}`, {
            method: "PUT",
            body: JSON.stringify({ status: "not_applied" }),
          })
        )
      );

      notify(`Fixed status for ${jobsToFix.length} jobs`, { type: "success" });
      refresh();
    } catch (error) {
      console.error("Error fixing job statuses:", error);
      notify("Error fixing job statuses", { type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <TopToolbar>
      <Button
        onClick={() => refresh()}
        startIcon={<RefreshIcon />}
        sx={{
          ...actionButtonStyles.base,
          ...actionButtonStyles.info,
        }}
      >
        Refresh
      </Button>
      <Button
        onClick={handleUpdateAllStatuses}
        startIcon={<BuildIcon />}
        sx={{
          ...actionButtonStyles.base,
          ...actionButtonStyles.warning,
        }}
        disabled={updating}
      >
        {updating ? "Fixing..." : "Fix Statuses"}
      </Button>
      <ExportButton
        sx={{
          ...actionButtonStyles.base,
          ...actionButtonStyles.success,
        }}
      />
    </TopToolbar>
  );
};

// Custom search input with immediate filtering
const SearchInput = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div style={{ flex: 1, maxWidth: "500px" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "8px 16px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          fontSize: "16px",
          "&:focus": {
            outline: "none",
            borderColor: "#1976D2",
            boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.1)",
          },
        }}
      />
    </div>
  );
};

// Custom component for job type and remote status
const JobTypeChip = ({ record }) => {
  if (!record) return null;

  const jobTypeConfig = {
    "full-time": {
      bg: "#E8F5E9",
      text: "#2E7D32",
      border: "#81C784",
      label: "Full Time",
    },
    "part-time": {
      bg: "#E3F2FD",
      text: "#1565C0",
      border: "#64B5F6",
      label: "Part Time",
    },
    contract: {
      bg: "#FFF3E0",
      text: "#E65100",
      border: "#FFB74D",
      label: "Contract",
    },
    internship: {
      bg: "#F3E5F5",
      text: "#6A1B9A",
      border: "#BA68C8",
      label: "Internship",
    },
    remote: {
      bg: "#E0F7FA",
      text: "#00838F",
      border: "#4DD0E1",
      icon: "🏠",
      label: "Remote",
    },
    freelance: {
      bg: "#FFF8E1",
      text: "#FF8F00",
      border: "#FFD54F",
      label: "Freelance",
    },
    temporary: {
      bg: "#F1F8E9",
      text: "#558B2F",
      border: "#AED581",
      label: "Temporary",
    },
  };

  // Default for unknown job types
  const defaultConfig = {
    bg: "#F5F5F5",
    text: "#616161",
    border: "#BDBDBD",
    icon: "💼",
    label: "Unknown",
  };

  // Get config based on job type (case insensitive)
  const jobType = record.jobType ? record.jobType.toLowerCase() : "";
  const config = jobTypeConfig[jobType] || defaultConfig;

  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: config.bg,
    color: config.text,
    border: `1px solid ${config.border}`,
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "0.875rem",
    fontWeight: "500",
    lineHeight: "1.2",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    transition: "all 0.2s ease",
    userSelect: "none",
    whiteSpace: "nowrap",
    height: "28px",
  };

  const remoteChipStyle = {
    ...chipStyle,
    backgroundColor: "#E0F7FA",
    color: "#00838F",
    border: "1px solid #80DEEA",
    padding: "4px 10px",
    fontSize: "0.8125rem",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={chipStyle}>
        <span style={{ fontSize: "14px" }}>{config.icon}</span>
        <span>{config.label}</span>
      </div>
      {record.isRemote && (
        <div style={remoteChipStyle}>
          <span style={{ fontSize: "14px" }}>🌐</span>
          <span>Remote</span>
        </div>
      )}
    </div>
  );
};

// Custom component for salary and experience
const JobDetails = ({ record }) => {
  if (!record) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {record.salary && (
        <span style={{ color: "#2E7D32", fontWeight: "bold" }}>
          {record.salary}
        </span>
      )}
      {record.experienceLevel && (
        <span style={{ color: "#666", fontSize: "0.9em" }}>
          {record.experienceLevel.charAt(0).toUpperCase() +
            record.experienceLevel.slice(1)}{" "}
          Level
        </span>
      )}
    </div>
  );
};

// Better StatusField component with direct HTTP calls for more reliable updates
const StatusField = ({ record }) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(
    record?.status || "not_applied"
  );
  const [isSaved, setIsSaved] = useState(record?.saved || false);
  const buttonRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Update local state when record changes
  useEffect(() => {
    if (record) {
      if (record.status) {
        setCurrentStatus(record.status);
      }
      setIsSaved(!!record.saved);
    }
  }, [record]);

  // Status configurations
  const statusColors = {
    not_applied: { bg: "#E0E0E0", text: "#424242", hover: "#D0D0D0" },
    applied: { bg: "#E3F2FD", text: "#1976D2", hover: "#BBE1FB" },
    interviewing: { bg: "#FFF3E0", text: "#F57C00", hover: "#FFE0B2" },
    offered: { bg: "#E8F5E9", text: "#2E7D32", hover: "#C8E6C9" },
    rejected: { bg: "#FFEBEE", text: "#C62828", hover: "#FFCDD2" },
    not_interested: { bg: "#F5F5F5", text: "#616161", hover: "#E0E0E0" },
  };

  const statusIcons = {
    not_applied: "📝",
    applied: "✉️",
    interviewing: "👥",
    offered: "🎉",
    rejected: "❌",
    not_interested: "⏹️",
  };

  const statusLabels = {
    not_applied: "Not Applied",
    applied: "Applied",
    interviewing: "Interviewing",
    offered: "Offered",
    rejected: "Rejected",
    not_interested: "Not Interested",
  };

  // Calculate menu position when open
  useEffect(() => {
    if (menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
  }, [menuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuOpen &&
        buttonRef.current &&
        menuRef.current &&
        !buttonRef.current.contains(event.target) &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    // Add document level event listeners
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Skip rendering if no record
  if (!record) return null;

  // Use not_applied as default status
  const status =
    currentStatus && statusLabels[currentStatus]
      ? currentStatus
      : "not_applied";

  const colors = statusColors[status] || statusColors.not_applied;

  // Handle status change with explicit event stopping
  const handleStatusChange = async (newStatus, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (newStatus === status || updating) return;

    try {
      setUpdating(true);

      console.log(
        `Updating job ${record.id} status from ${status} to ${newStatus}`
      );

      const response = await fetch(
        `http://localhost:5050/api/jobs/${encodeURIComponent(record.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            lastUpdated: ensureValidDate(new Date()),
            datePosted: ensureValidDate(record.datePosted),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Update successful:", result);

      setCurrentStatus(newStatus);
      notify(`Status updated to ${statusLabels[newStatus]}`, {
        type: "success",
      });
      setMenuOpen(false);
      setTimeout(() => refresh(), 100);
    } catch (error) {
      console.error("Error updating status:", error);
      notify(`Error updating status: ${error.message}`, { type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  // Toggle menu
  const handleToggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  // Save/unsave job
  const handleSaveJob = async (e) => {
    e.stopPropagation();
    if (updating) return;

    try {
      setUpdating(true);
      // Don't close menu yet

      const newSavedState = !isSaved;
      console.log(`${isSaved ? "Unsaving" : "Saving"} job ${record.id}`);

      const response = await fetch(
        `http://localhost:5050/api/jobs/${encodeURIComponent(record.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            saved: newSavedState,
            savedAt: newSavedState ? new Date().toISOString() : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Save/unsave successful:", result);

      // Update local state immediately
      setIsSaved(newSavedState);

      notify(
        isSaved ? "Job removed from saved jobs" : "Job saved successfully",
        { type: "success" }
      );

      // Refresh in the background to update other components
      setTimeout(() => refresh(), 100);
    } catch (error) {
      console.error("Error saving job:", error);
      notify(`Error updating job: ${error.message}`, { type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  // Main button UI
  const statusButton = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        alignItems: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        ref={buttonRef}
        style={{
          backgroundColor: hover ? colors.hover : colors.bg,
          color: colors.text,
          padding: "8px 16px",
          borderRadius: "20px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          fontSize: "0.875rem",
          fontWeight: 600,
          textAlign: "center",
          minWidth: "130px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: hover
            ? "0 2px 8px rgba(0,0,0,0.15)"
            : "0 1px 3px rgba(0,0,0,0.1)",
          border: `1px solid ${colors.text}20`,
          opacity: updating ? 0.7 : 1,
        }}
        onClick={handleToggleMenu}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <span style={{ fontSize: "14px" }}>{statusIcons[status]}</span>
        {updating ? "Updating..." : statusLabels[status]}
        <span
          style={{
            marginLeft: "4px",
            fontSize: "10px",
            transition: "transform 0.2s ease",
            transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </div>
      <div
        style={{
          fontSize: "0.7rem",
          color: "#757575",
          textAlign: "center",
          opacity: hover ? 1 : 0.7,
          transition: "opacity 0.2s ease",
        }}
      ></div>
    </div>
  );

  // Dropdown menu UI
  const menu = menuOpen
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            transform: "translateX(-50%)",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 9999,
            padding: "8px 0",
            width: "220px",
            maxHeight: "400px",
            overflowY: "auto",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #f0f0f0",
              fontSize: "0.75rem",
              color: "#666",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Change Status
          </div>
          {Object.entries(statusLabels).map(([key, label]) => (
            <div
              key={key}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                backgroundColor:
                  key === status ? statusColors[key].bg : "transparent",
                color: statusColors[key].text,
                fontWeight: key === status ? 600 : 400,
                transition: "background-color 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderLeft:
                  key === status
                    ? `4px solid ${statusColors[key].text}`
                    : "4px solid transparent",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = statusColors[key].hover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor =
                  key === status ? statusColors[key].bg : "transparent";
              }}
              onClick={(e) => handleStatusChange(key, e)}
              onMouseDown={(e) =>
                e.preventDefault()
              } /* Prevent unwanted blur/focus events */
            >
              <span
                style={{ fontSize: "16px", width: "20px", textAlign: "center" }}
              >
                {statusIcons[key]}
              </span>
              <span>{label}</span>
              {key === status && (
                <span style={{ marginLeft: "auto", fontSize: "12px" }}>✓</span>
              )}
            </div>
          ))}

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "#f0f0f0",
              margin: "8px 0",
            }}
          ></div>

          {/* Save Job Option */}
          <div
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              backgroundColor: "transparent",
              color: isSaved ? "#4CAF50" : "#757575",
              fontWeight: 500,
              transition: "background-color 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            onClick={handleSaveJob}
            onMouseDown={(e) =>
              e.preventDefault()
            } /* Prevent unwanted blur/focus events */
          >
            <span
              style={{ fontSize: "16px", width: "20px", textAlign: "center" }}
            >
              {isSaved ? "★" : "☆"}
            </span>
            <span>{isSaved ? "Remove from Saved" : "Save Job"}</span>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {statusButton}
      {menu}
    </>
  );
};

// Custom component for requirements and benefits
const JobRequirements = ({ record }) => {
  if (!record) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {record.requirements && record.requirements.length > 0 && (
        <div style={{ fontSize: "0.9em" }}>
          <strong>Requirements:</strong>{" "}
          {record.requirements.slice(0, 2).join(", ")}
          {record.requirements.length > 2 && "..."}
        </div>
      )}
      {record.benefits && record.benefits.length > 0 && (
        <div style={{ fontSize: "0.9em", color: "#2E7D32" }}>
          <strong>Benefits:</strong> {record.benefits.slice(0, 2).join(", ")}
          {record.benefits.length > 2 && "..."}
        </div>
      )}
    </div>
  );
};

// Custom component for source and last updated
const JobSource = ({ record }) => {
  if (!record) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <ChipField source="source" record={record} />
      <span style={{ fontSize: "0.8em", color: "#666" }}>
        Updated: {new Date(record.lastUpdated).toLocaleDateString()}
      </span>
    </div>
  );
};

// Custom component for displaying match score with color coding
const MatchScoreField = ({ record }) => {
  if (!record) return null;
  const score = record.matchScore || 0;
  const getScoreColor = (score) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 60) return "#FFC107";
    return "#F44336";
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: getScoreColor(score),
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
        }}
      >
        {score}%
      </div>
      <div>
        <div style={{ fontWeight: "bold" }}>Match Score</div>
        <div style={{ fontSize: "0.9em", color: "#666" }}>
          {score >= 80
            ? "High Match"
            : score >= 60
            ? "Medium Match"
            : "Low Match"}
        </div>
      </div>
    </div>
  );
};

// Custom component for displaying analytics
const AnalyticsField = ({ record }) => {
  if (!record) return null;

  const getTrendIcon = (trend) => {
    if (trend > 0) return "↑";
    if (trend < 0) return "↓";
    return "→";
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return "#4CAF50";
    if (trend < 0) return "#F44336";
    return "#757575";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          Applications
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2em" }}>
            {record.applicationCount || 0}
          </span>
          {record.applyTrend !== undefined && (
            <span style={{ color: getTrendColor(record.applyTrend) }}>
              {getTrendIcon(record.applyTrend)} {Math.abs(record.applyTrend)}%
            </span>
          )}
        </div>
      </div>
      <div>
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Views</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2em" }}>{record.views || 0}</span>
          {record.viewTrend !== undefined && (
            <span style={{ color: getTrendColor(record.viewTrend) }}>
              {getTrendIcon(record.viewTrend)} {Math.abs(record.viewTrend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom component for displaying matched keywords
const MatchedKeywordsField = ({ record }) => {
  if (!record) return null;
  const keywords = record.matchedKeywords || [];

  return (
    <div>
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
        Matched Keywords
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {keywords.length > 0 ? (
          keywords.map((keyword, index) => (
            <Chip
              key={index}
              label={keyword}
              style={{
                backgroundColor: "#E3F2FD",
                color: "#1976D2",
              }}
            />
          ))
        ) : (
          <span style={{ color: "#666", fontStyle: "italic" }}>
            No keywords matched
          </span>
        )}
      </div>
    </div>
  );
};

// Enhanced CustomDatagrid with improved styles for better dropdown handling
const CustomDatagrid = (props) => (
  <Datagrid
    {...props}
    sx={{
      "& .RaDatagrid-headerCell": {
        backgroundColor: "#f5f5f5",
        fontWeight: "bold",
        color: "#424242",
        padding: "16px 8px",
        borderBottom: "2px solid #e0e0e0",
      },
      "& .RaDatagrid-row": {
        transition: "background-color 0.2s ease",
        "&:hover": {
          backgroundColor: "#f9f9f9",
        },
      },
      "& .RaDatagrid-rowCell": {
        padding: "12px 8px",
        borderBottom: "1px solid #e0e0e0",
        verticalAlign: "middle",
        position: "relative",
      },
      "& .column-title": {
        fontWeight: "bold",
        color: "#2196F3",
      },
      "& .column-company": {
        fontWeight: "bold",
      },
      "& .column-url": {
        textAlign: "center",
      },
      "& .status-dropdown": {
        position: "relative",
        zIndex: 10,
      },
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px",
      overflow: "visible", // Changed from 'hidden' to allow dropdowns
      marginTop: "20px", // Add space above the table
      marginBottom: "30px", // Add more space below the table
      // Ensure dropdowns appear over other elements
      "& .MuiPopover-root": {
        zIndex: 1500,
      },
      "& .MuiAutocomplete-popper": {
        zIndex: 1500,
      },
      "& .MuiMenu-paper": {
        zIndex: 1500,
      },
    }}
  />
);

// Custom empty state component
const EmptyList = () => (
  <div
    style={{
      padding: "40px 20px",
      textAlign: "center",
      color: "#757575",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      margin: "20px 0",
      boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
    }}
  >
    <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>
      📋
    </div>
    <h3 style={{ color: "#424242", marginBottom: "10px" }}>No jobs found</h3>
    <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto" }}>
      Try adjusting your filters or search for different keywords to find more
      job opportunities.
    </p>
  </div>
);

// Add these helper functions before the components
const getDateFilterRange = (filterValue) => {
  const today = startOfToday();
  switch (filterValue) {
    case "today":
      return { start: today, end: null };
    case "yesterday":
      return { start: subDays(today, 1), end: today };
    case "week":
      return { start: subDays(today, 7), end: null };
    case "month":
      return { start: subDays(today, 30), end: null };
    case "older":
      return { start: null, end: subDays(today, 30) };
    default:
      return { start: null, end: null };
  }
};

const filterJobsByDate = (jobs, dateFilter, dateField = "datePosted") => {
  if (!dateFilter || dateFilter === "all") return jobs;

  const { start, end } = getDateFilterRange(dateFilter);

  return jobs.filter((job) => {
    const jobDate = parseISO(job[dateField]);
    if (start && end) {
      return isAfter(jobDate, start) && isBefore(jobDate, end);
    } else if (start) {
      return isAfter(jobDate, start);
    } else if (end) {
      return isBefore(jobDate, end);
    }
    return true;
  });
};

// Update JobList component's date filtering
const JobList = () => {
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const notify = useNotify();
  const refresh = useRefresh();
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(1);
  const batchSize = 25;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sort, setSort] = useState({ field: "datePosted", order: "desc" });
  const [search, setSearch] = useState("");

  // Format date function to ensure consistent date display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      // Handle case where dateString is an object
      if (typeof dateString === "object" && dateString !== null) {
        if (dateString.$date) {
          dateString = dateString.$date;
        } else {
          console.error("Invalid date object:", dateString);
          return "-";
        }
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return "-";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone: "UTC",
      });
    } catch (error) {
      console.error("Error formatting date:", error, "for date:", dateString);
      return "-";
    }
  };

  // Validate and format date for API
  const validateAndFormatDate = (dateString) => {
    if (!dateString) return null;
    try {
      // Handle case where dateString is an object
      if (typeof dateString === "object" && dateString !== null) {
        if (dateString.$date) {
          dateString = dateString.$date;
        } else {
          console.error("Invalid date object:", dateString);
          return null;
        }
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return null;
      }

      return date.toISOString();
    } catch (error) {
      console.error("Error validating date:", error, "for date:", dateString);
      return null;
    }
  };

  // Load initial available jobs (not applied) - only first batch
  useEffect(() => {
    const fetchAvailableJobs = async () => {
      try {
        setLoading(true);
        setInitialLoading(true);

        // Fetch all jobs first to get accurate total count
        const allJobsResponse = await fetch("http://localhost:5050/api/jobs");
        const allJobs = await allJobsResponse.json();

        // Validate and format dates in the jobs data
        const processedJobs = allJobs.map((job) => ({
          ...job,
          datePosted: validateAndFormatDate(job.datePosted),
          lastUpdated: validateAndFormatDate(job.lastUpdated),
        }));

        // Get total count from header
        const contentRange = allJobsResponse.headers.get("Content-Range");
        let total = 0;
        if (contentRange) {
          const rangeParts = contentRange.split("/");
          if (rangeParts.length > 1) {
            total = parseInt(rangeParts[1]);
            setTotalCount(total);
            setHasMore(total > batchSize);
            console.log(`Total jobs in database: ${total}`);
          }
        }

        // Filter for available jobs
        const availableJobs = processedJobs.filter(
          (job) =>
            job.status === "not_applied" || job.status === "not_interested"
        );

        console.log(
          `Found ${availableJobs.length} available jobs out of ${total} total jobs`
        );

        setJobs(availableJobs);
        setFilteredJobs(availableJobs);
      } catch (error) {
        console.error("Error loading available jobs:", error);
        notify("Error loading available jobs", { type: "error" });
        setJobs([]);
        setFilteredJobs([]);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    fetchAvailableJobs();
  }, [notify]);

  // Update filtered jobs when search changes
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredJobs(jobs);
      return;
    }

    const lowerSearch = search.toLowerCase().trim();
    const filtered = jobs.filter(
      (job) =>
        (job.title && job.title.toLowerCase().includes(lowerSearch)) ||
        (job.company && job.company.toLowerCase().includes(lowerSearch)) ||
        (job.location && job.location.toLowerCase().includes(lowerSearch))
    );

    setFilteredJobs(filtered);
  }, [jobs, search]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Handle sorting
  const handleSort = (field) => {
    const newSortConfig = {
      field,
      order: sort.field === field && sort.order === "asc" ? "desc" : "asc",
    };
    setSort(newSortConfig);

    const sorted = [...filteredJobs].sort((a, b) => {
      const aValue = a[field] || "";
      const bValue = b[field] || "";

      if (field === "datePosted" || field === "lastUpdated") {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return newSortConfig.order === "asc" ? dateA - dateB : dateB - dateA;
      }

      return newSortConfig.order === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    setFilteredJobs(sorted);
  };

  // Get current page of jobs
  const getCurrentPageJobs = () => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredJobs.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredJobs.length / perPage);

  // Handle next page - load more jobs if needed
  const handleNextPage = async () => {
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * perPage;

    // Check if we need to load more jobs
    if (startIndex + perPage > filteredJobs.length && hasMore) {
      await loadMoreJobs();
    }

    setPage(nextPage);
  };

  // Load more jobs function for pagination
  const loadMoreJobs = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const nextBatch = currentBatch + 1;
      const startIndex = currentBatch * batchSize;

      console.log(`Loading more jobs from index ${startIndex}...`);

      // Fetch all jobs again to ensure we have the latest data
      const response = await fetch("http://localhost:5050/api/jobs");
      const allJobs = await response.json();

      // Filter for available jobs
      const availableJobs = allJobs.filter(
        (job) => job.status === "not_applied" || job.status === "not_interested"
      );

      // Get the next batch of available jobs
      const newJobs = availableJobs.slice(startIndex, startIndex + batchSize);

      if (newJobs.length === 0) {
        setHasMore(false);
        return;
      }

      console.log(`Loaded ${newJobs.length} more jobs`);

      // Merge with existing jobs and update state
      const updatedJobs = [...jobs, ...newJobs];
      setJobs(updatedJobs);
      setFilteredJobs(updatedJobs);
      setCurrentBatch(nextBatch);

      // Check if we've reached the end
      setHasMore(updatedJobs.length < availableJobs.length);
    } catch (error) {
      console.error("Error loading more jobs:", error);
      notify("Error loading more jobs", { type: "error" });
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Loading state
  if (initialLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading available jobs...</p>
      </div>
    );
  }

  // Get current page data
  const currentJobs = getCurrentPageJobs();

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Available Jobs ({totalCount})</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <FetchJobsButton
            sx={{
              ...actionButtonStyles.base,
              ...actionButtonStyles.primary,
            }}
          />
        </div>
      </div>

      {/* Search input */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search jobs..."
        />
      </div>

      {filteredJobs.length === 0 ? (
        <EmptyList />
      ) : (
        <>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              marginBottom: "16px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th
                    onClick={() => handleSort("title")}
                    style={{
                      padding: "16px 12px",
                      textAlign: "left",
                      borderBottom: "2px solid #e0e0e0",
                      cursor: "pointer",
                    }}
                  >
                    Job Title{" "}
                    {sort.field === "title" &&
                      (sort.order === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("company")}
                    style={{
                      padding: "16px 12px",
                      textAlign: "left",
                      borderBottom: "2px solid #e0e0e0",
                      cursor: "pointer",
                    }}
                  >
                    Company{" "}
                    {sort.field === "company" &&
                      (sort.order === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("location")}
                    style={{
                      padding: "16px 12px",
                      textAlign: "left",
                      borderBottom: "2px solid #e0e0e0",
                      cursor: "pointer",
                    }}
                  >
                    Location{" "}
                    {sort.field === "location" &&
                      (sort.order === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{
                      padding: "16px 12px",
                      textAlign: "left",
                      borderBottom: "2px solid #e0e0e0",
                    }}
                  >
                    Job Type
                  </th>
                  <th
                    style={{
                      padding: "16px 12px",
                      textAlign: "left",
                      borderBottom: "2px solid #e0e0e0",
                    }}
                  >
                    Status
                  </th>
                  <th
                    onClick={() => handleSort("datePosted")}
                    style={{
                      padding: "16px 12px",
                      textAlign: "left",
                      borderBottom: "2px solid #e0e0e0",
                      cursor: "pointer",
                    }}
                  >
                    Posted Date{" "}
                    {sort.field === "datePosted" &&
                      (sort.order === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{
                      padding: "16px 12px",
                      textAlign: "left",
                      borderBottom: "2px solid #e0e0e0",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentJobs.map((job) => (
                  <tr
                    key={job.id}
                    style={{
                      borderBottom: "1px solid #e0e0e0",
                      backgroundColor: "white",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f9f9f9")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "white")
                    }
                  >
                    <td style={{ padding: "14px 12px" }}>
                      <strong>{job.title}</strong>
                    </td>
                    <td style={{ padding: "14px 12px" }}>{job.company}</td>
                    <td style={{ padding: "14px 12px" }}>{job.location}</td>
                    <td style={{ padding: "14px 12px" }}>
                      <JobTypeChip record={job} />
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <StatusField record={job} />
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      {formatDate(job.datePosted)}
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <JobLinkButton record={job} />
                        <QuickActions record={job} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div>
              Showing {filteredJobs.length > 0 ? (page - 1) * perPage + 1 : 0}{" "}
              to {Math.min(page * perPage, filteredJobs.length)} of{" "}
              {filteredJobs.length} jobs (Total in database: {totalCount})
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                startIcon={<NavigateBeforeIcon />}
                sx={paginationButtonStyle}
              >
                Previous
              </Button>
              <div style={{ padding: "8px 12px", textAlign: "center" }}>
                Page {page} of {totalPages || 1}
              </div>
              <Button
                onClick={handleNextPage}
                disabled={page >= totalPages && !hasMore}
                endIcon={<NavigateNextIcon />}
                sx={paginationButtonStyle}
              >
                {loadingMore ? "Loading..." : "Next"}
              </Button>
              {hasMore && page >= totalPages && !loadingMore && (
                <Button
                  onClick={loadMoreJobs}
                  startIcon={<ArrowDownwardIcon />}
                  sx={{
                    ...actionButtonStyles.base,
                    ...actionButtonStyles.success,
                  }}
                >
                  Load More Jobs
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Custom saved jobs list with pagination
const SavedJobsList = () => {
  const isSmall = useMediaQuery("(max-width:960px)");
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [search, setSearch] = useState("");
  const notify = useNotify();
  const refresh = useRefresh();

  // Apply search filter to jobs
  const applyFilters = useCallback((allJobs, searchTerm) => {
    let filtered = allJobs;

    // Apply search filter
    if (searchTerm && searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          (job.title && job.title.toLowerCase().includes(lowerSearch)) ||
          (job.company && job.company.toLowerCase().includes(lowerSearch)) ||
          (job.location && job.location.toLowerCase().includes(lowerSearch))
      );
    }

    setFilteredJobs(filtered);
  }, []);

  // Update filtered jobs whenever search or jobs change
  useEffect(() => {
    applyFilters(jobs, search);
  }, [jobs, search, applyFilters]);

  // Load saved jobs
  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        setLoading(true);
        const { json } = await httpClient("http://localhost:5050/api/jobs");
        const savedJobs = json.filter((job) => job.saved === true);
        setJobs(savedJobs);
      } catch (error) {
        console.error("Error loading saved jobs:", error);
        notify("Error loading saved jobs", { type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, [notify]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      const response = await fetch(
        `http://localhost:5050/api/jobs/${encodeURIComponent(jobId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            saved: false,
            savedAt: null,
          }),
        }
      );

      // Filter out the removed job
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      setFilteredJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      notify("Job removed from saved jobs", { type: "success" });
    } catch (error) {
      console.error("Error removing job from saved:", error);
      notify("Error removing job", { type: "error" });
    }
  };

  // Custom empty state for no saved jobs
  if (!loading && jobs.length === 0) {
    return (
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#757575",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            margin: "20px 0",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>
            ☆
          </div>
          <h3 style={{ color: "#424242", marginBottom: "10px" }}>
            No saved jobs found
          </h3>
          <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto" }}>
            You haven't saved any jobs yet. Go to Available Jobs to find and
            save jobs that interest you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Saved Jobs ({filteredJobs.length})</h2>
      </div>

      {/* Filter controls */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        {/* Search input */}
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search by title, company, or location..."
            value={search}
            onChange={handleSearchChange}
            style={{
              width: "100%",
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #e0e0e0",
              fontSize: "16px",
            }}
          />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#757575",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            margin: "20px 0",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>
            🔍
          </div>
          <h3 style={{ color: "#424242", marginBottom: "10px" }}>
            No jobs match your search
          </h3>
          <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto" }}>
            Try adjusting your search to see more results.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            marginBottom: "30px",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Job Title
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Company
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Location
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Saved Date
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Posted Date
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  style={{
                    borderBottom: "1px solid #e0e0e0",
                    "&:hover": { backgroundColor: "#f9f9f9" },
                  }}
                >
                  <td style={{ padding: "14px 12px" }}>
                    <strong>{job.title}</strong>
                  </td>
                  <td style={{ padding: "14px 12px" }}>{job.company}</td>
                  <td style={{ padding: "14px 12px" }}>{job.location}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <StatusField record={job} />
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    {job.savedAt
                      ? new Date(job.savedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    {job.datePosted
                      ? new Date(job.datePosted).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => window.open(job.url, "_blank")}
                        disabled={!job.url}
                        sx={{
                          ...actionButtonStyles.base,
                          ...actionButtonStyles.primary,
                        }}
                      >
                        Visit
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        component={Link}
                        to={`/saved-jobs/${job.id}/show`}
                        sx={{
                          ...actionButtonStyles.base,
                          ...actionButtonStyles.info,
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleUnsaveJob(job.id)}
                        sx={{
                          ...actionButtonStyles.base,
                          ...actionButtonStyles.error,
                        }}
                      >
                        Unsave
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Custom applied jobs list with pagination
const AppliedJobsList = () => {
  const isSmall = useMediaQuery("(max-width:960px)");
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const notify = useNotify();
  const refresh = useRefresh();
  const [search, setSearch] = useState("");

  // Apply search filter to jobs
  const applyFilters = useCallback((allJobs, searchTerm) => {
    let filtered = allJobs;

    // Apply search filter
    if (searchTerm && searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          (job.title && job.title.toLowerCase().includes(lowerSearch)) ||
          (job.company && job.company.toLowerCase().includes(lowerSearch)) ||
          (job.location && job.location.toLowerCase().includes(lowerSearch))
      );
    }

    setFilteredJobs(filtered);
  }, []);

  // Update filtered jobs whenever search or jobs change
  useEffect(() => {
    applyFilters(jobs, search);
  }, [jobs, search, applyFilters]);

  // Load applied jobs
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5050/api/jobs");
        const allJobs = await response.json();
        const appliedJobs = allJobs.filter((job) =>
          ["applied", "interviewing", "offered", "rejected"].includes(
            job.status
          )
        );
        setJobs(appliedJobs);
      } catch (error) {
        console.error("Error loading applied jobs:", error);
        notify("Error loading applied jobs", { type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchAppliedJobs();
  }, [notify]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Custom empty state for no applied jobs
  if (!loading && jobs.length === 0) {
    return (
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#757575",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            margin: "20px 0",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>
            📋
          </div>
          <h3 style={{ color: "#424242", marginBottom: "10px" }}>
            No applied jobs found
          </h3>
          <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto" }}>
            You haven't applied to any jobs yet. Go to Available Jobs to find
            and apply for jobs.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading applied jobs...</p>
      </div>
    );
  }

  // Filtered jobs message
  const filteredMessage =
    filteredJobs.length !== jobs.length
      ? `Showing ${filteredJobs.length} of ${jobs.length} applied jobs`
      : `Applied Jobs (${jobs.length})`;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>{filteredMessage}</h2>
      </div>

      {/* Filter controls */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        {/* Search input */}
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search by title, company, or location..."
            value={search}
            onChange={handleSearchChange}
            style={{
              width: "100%",
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #e0e0e0",
              fontSize: "16px",
            }}
          />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#757575",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            margin: "20px 0",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>
            🔍
          </div>
          <h3 style={{ color: "#424242", marginBottom: "10px" }}>
            No jobs match your search
          </h3>
          <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto" }}>
            Try adjusting your search to see more results.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            marginBottom: "30px",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Job Title
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Company
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Applied Date
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Posted Date
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  style={{
                    borderBottom: "1px solid #e0e0e0",
                    "&:hover": { backgroundColor: "#f9f9f9" },
                  }}
                >
                  <td style={{ padding: "14px 12px" }}>
                    <strong>{job.title}</strong>
                  </td>
                  <td style={{ padding: "14px 12px" }}>{job.company}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <StatusField record={job} />
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    {new Date(job.lastUpdated).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    {job.datePosted
                      ? new Date(job.datePosted).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => window.open(job.url, "_blank")}
                        disabled={!job.url}
                        sx={{
                          ...actionButtonStyles.base,
                          ...actionButtonStyles.primary,
                        }}
                      >
                        Visit
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        component={Link}
                        to={`/applied-jobs/${job.id}/show`}
                        sx={{
                          ...actionButtonStyles.base,
                          ...actionButtonStyles.info,
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Custom not interested jobs list with pagination
const NotInterestedJobsList = () => {
  const isSmall = useMediaQuery("(max-width:960px)");
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const notify = useNotify();
  const refresh = useRefresh();
  const [search, setSearch] = useState("");

  // Apply search filter to jobs
  const applyFilters = useCallback((allJobs, searchTerm) => {
    let filtered = allJobs;

    // Apply search filter
    if (searchTerm && searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          (job.title && job.title.toLowerCase().includes(lowerSearch)) ||
          (job.company && job.company.toLowerCase().includes(lowerSearch)) ||
          (job.location && job.location.toLowerCase().includes(lowerSearch))
      );
    }

    setFilteredJobs(filtered);
  }, []);

  // Update filtered jobs whenever search or jobs change
  useEffect(() => {
    applyFilters(jobs, search);
  }, [jobs, search, applyFilters]);

  // Load not interested jobs
  useEffect(() => {
    const fetchNotInterestedJobs = async () => {
      try {
        setLoading(true);
        const { json } = await httpClient("http://localhost:5050/api/jobs");
        const notInterestedJobs = json.filter(
          (job) => job.status === "not_interested"
        );
        setJobs(notInterestedJobs);
      } catch (error) {
        console.error("Error loading not interested jobs:", error);
        notify("Error loading not interested jobs", { type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchNotInterestedJobs();
  }, [notify]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Custom empty state for no not interested jobs
  if (!loading && jobs.length === 0) {
    return (
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#757575",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            margin: "20px 0",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>
            ⏹️
          </div>
          <h3 style={{ color: "#424242", marginBottom: "10px" }}>
            No jobs marked as "Not Interested"
          </h3>
          <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto" }}>
            You haven't marked any jobs as "Not Interested" yet. Mark jobs that
            don't fit your criteria to keep your job board organized.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading not interested jobs...</p>
      </div>
    );
  }

  // Filtered jobs message
  const filteredMessage =
    filteredJobs.length !== jobs.length
      ? `Showing ${filteredJobs.length} of ${jobs.length} not interested jobs`
      : `Not Interested Jobs (${jobs.length})`;

  // Handle marking as available again
  const handleMarkAsAvailable = async (jobId) => {
    try {
      const response = await fetch(
        `http://localhost:5050/api/jobs/${encodeURIComponent(jobId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "not_applied",
          }),
        }
      );

      // Filter out the updated job
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      setFilteredJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      notify("Job marked as available again", { type: "success" });
    } catch (error) {
      console.error("Error updating job status:", error);
      notify("Error updating job", { type: "error" });
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>{filteredMessage}</h2>
      </div>

      {/* Filter controls */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        {/* Search input */}
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search by title, company, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 16px",
              borderRadius: "4px",
              border: "1px solid #e0e0e0",
              fontSize: "16px",
            }}
          />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#757575",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            margin: "20px 0",
            boxShadow: "inset 0 0 5px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>
            🔍
          </div>
          <h3 style={{ color: "#424242", marginBottom: "10px" }}>
            No jobs match your search
          </h3>
          <p style={{ fontSize: "14px", maxWidth: "500px", margin: "0 auto" }}>
            Try adjusting your search to see more results.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            marginBottom: "30px",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Job Title
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Company
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Location
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Job Type
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Date Added
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Date Posted
                </th>
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "left",
                    borderBottom: "2px solid #e0e0e0",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  style={{
                    borderBottom: "1px solid #e0e0e0",
                    backgroundColor: "white",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9f9f9")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  <td style={{ padding: "14px 12px" }}>
                    <strong>{job.title}</strong>
                  </td>
                  <td style={{ padding: "14px 12px" }}>{job.company}</td>
                  <td style={{ padding: "14px 12px" }}>{job.location}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <JobTypeChip record={job} />
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    {new Date(job.lastUpdated).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    {new Date(job.datePosted).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => window.open(job.url, "_blank")}
                        disabled={!job.url}
                        sx={{
                          ...actionButtonStyles.base,
                          ...actionButtonStyles.primary,
                        }}
                      >
                        Visit
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        component={Link}
                        to={`/not-interested-jobs/${job.id}/show`}
                        sx={{
                          ...actionButtonStyles.base,
                          ...actionButtonStyles.info,
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleMarkAsAvailable(job.id)}
                        sx={{
                          ...actionButtonStyles.base,
                          ...actionButtonStyles.success,
                        }}
                      >
                        Make Available
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Define pagination button style
const paginationButtonStyle = {
  ...actionButtonStyles.base,
  ...actionButtonStyles.info,
  minWidth: "80px",
};

// JobLinkButton component
const JobLinkButton = (props) => {
  const record = useRecordContext(props);
  const notify = useNotify();
  const [hover, setHover] = useState(false);

  if (!record) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (!record.url) {
      notify("No URL available for this job", { type: "warning" });
      return;
    }
    window.open(record.url, "_blank");
  };

  return (
    <FunctionField
      {...props}
      render={() => (
        <Button
          variant="contained"
          size="small"
          onClick={handleClick}
          disabled={!record.url}
          sx={{
            ...actionButtonStyles.base,
            ...actionButtonStyles.primary,
            minWidth: "120px",
          }}
        >
          <span>{record.url ? "Apply Now" : "No URL"}</span>
        </Button>
      )}
    />
  );
};

// QuickActions component
const QuickActions = ({ record }) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(record?.saved || false);

  useEffect(() => {
    if (record) {
      setIsSaved(!!record.saved);
    }
  }, [record]);

  if (!record) return null;

  const handleSaveJob = async (e) => {
    e.stopPropagation();
    if (saving) return;

    try {
      setSaving(true);
      const newSavedState = !isSaved;

      const response = await fetch(
        `http://localhost:5050/api/jobs/${encodeURIComponent(record.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            saved: newSavedState,
            savedAt: newSavedState ? new Date().toISOString() : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setIsSaved(newSavedState);
      notify(
        isSaved ? "Job removed from saved jobs" : "Job saved successfully",
        { type: "success" }
      );
      setTimeout(() => refresh(), 100);
    } catch (error) {
      console.error("Error saving job:", error);
      notify(`Error updating job: ${error.message}`, { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleShareJob = (e) => {
    e.stopPropagation();
    if (!record.url) {
      notify("Cannot share this job - URL is missing", { type: "warning" });
      return;
    }
    const shareUrl = `${window.location.origin}/jobs/${encodeURIComponent(
      record.id
    )}`;
    navigator.clipboard.writeText(shareUrl);
    notify("Job link copied to clipboard", { type: "success" });
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <Button
        onClick={handleSaveJob}
        size="small"
        disabled={saving}
        className="icon-only"
        title={isSaved ? "Unsave Job" : "Save Job"}
        sx={{
          ...actionButtonStyles.base,
          ...(isSaved
            ? actionButtonStyles.success
            : actionButtonStyles.secondary),
          minWidth: "36px",
          width: "36px",
          height: "36px",
          padding: "8px",
          opacity: saving ? 0.7 : 1,
          "& .MuiSvgIcon-root": {
            fontSize: "18px",
          },
        }}
      >
        {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
      </Button>

      <Button
        onClick={handleShareJob}
        size="small"
        className="icon-only"
        title="Share Job"
        sx={{
          ...actionButtonStyles.base,
          ...actionButtonStyles.info,
          minWidth: "36px",
          width: "36px",
          height: "36px",
          padding: "8px",
          "& .MuiSvgIcon-root": {
            fontSize: "18px",
          },
        }}
      >
        <ShareIcon />
      </Button>

      <Button
        variant="contained"
        size="small"
        component={Link}
        to={`/jobs/${record.id}/show`}
        className="icon-only"
        title="View Details"
        sx={{
          ...actionButtonStyles.base,
          ...actionButtonStyles.primary,
          minWidth: "36px",
          width: "36px",
          height: "36px",
          padding: "8px",
          "& .MuiSvgIcon-root": {
            fontSize: "18px",
          },
        }}
      >
        <InfoIcon />
      </Button>
    </div>
  );
};

const App = () => (
  <Admin
    layout={CustomLayout}
    dashboard={Dashboard}
    dataProvider={dataProvider}
    requireAuth={false}
  >
    <Resource
      name="jobs"
      list={JobList}
      show={JobShow}
      options={{ label: "Available Jobs" }}
      actions={<FetchJobsButton />}
    />
    <Resource
      name="applied-jobs"
      list={AppliedJobsList}
      show={JobShow}
      options={{ label: "Applied Jobs" }}
    />
    <Resource
      name="saved-jobs"
      list={SavedJobsList}
      show={JobShow}
      options={{ label: "Saved Jobs" }}
    />
    <Resource
      name="not-interested-jobs"
      list={NotInterestedJobsList}
      show={JobShow}
      options={{ label: "Not Interested Jobs" }}
    />
    <Resource
      name="resume"
      list={ResumeUpload}
      options={{ label: "Resume Analysis" }}
    />
  </Admin>
);

export default App;

// Git Host all new data commands;
// git init
// git add .
// git commit -m "Updated"
// git push

// Jerry -
// Update MAY 16, 2025
