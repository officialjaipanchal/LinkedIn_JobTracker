import React, { useState, useEffect } from "react";
import {
  List,
  Datagrid,
  TextField,
  DateField,
  SearchInput,
  FilterButton,
  TopToolbar,
  ExportButton,
  TextInput,
  useNotify,
  useRefresh,
  Button,
  SelectInput,
} from "react-admin";
import { Box, Chip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { JobTypeChip } from "./JobTypeChip";
import { httpClient } from "../utils/httpClient";

const dateFilterChoices = [
  { id: "*", name: "All" },
  { id: "today", name: "Today" },
  { id: "week", name: "This Week" },
  { id: "month", name: "This Month" },
  { id: "older", name: "Older" },
];

const SavedJobFilters = [
  <SearchInput source="q" alwaysOn />,
  <SelectInput
    source="dateFilter"
    choices={dateFilterChoices}
    alwaysOn
    defaultValue="*"
  />,
  <TextInput label="Title" source="title" />,
  <TextInput label="Company" source="company" />,
  <TextInput label="Location" source="location" />,
];

const SavedJobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFilter: "*", // Default to show all
  });
  const notify = useNotify();
  const refresh = useRefresh();

  useEffect(() => {
    fetchSavedJobs();
  }, [filters]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get("/jobs/saved", {
        params: {
          ...filters,
          dateFilter: filters.dateFilter || "*", // Ensure dateFilter is always set
        },
      });
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      notify("Error loading saved jobs", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromSaved = async (jobId) => {
    try {
      await httpClient.delete(`/jobs/saved/${jobId}`);
      notify("Job removed from saved list", { type: "success" });
      refresh();
    } catch (error) {
      console.error("Error removing job:", error);
      notify("Error removing job", { type: "error" });
    }
  };

  const ListActions = () => (
    <TopToolbar>
      <FilterButton />
      <ExportButton />
    </TopToolbar>
  );

  return (
    <List
      filters={SavedJobFilters}
      actions={<ListActions />}
      loading={loading}
      filterDefaultValues={{ dateFilter: "*" }}
    >
      <Datagrid>
        <TextField source="title" />
        <TextField source="company" />
        <TextField source="location" />
        <DateField source="datePosted" showTime />
        <JobTypeChip source="jobType" />
        <Box>
          {(record) => (
            <Chip
              label={record.isRemote ? "Remote" : "On-site"}
              color={record.isRemote ? "success" : "default"}
              size="small"
            />
          )}
        </Box>
        <Box>
          {(record) => (
            <Button
              label="Remove"
              onClick={() => handleRemoveFromSaved(record.id)}
              startIcon={<DeleteIcon />}
            />
          )}
        </Box>
      </Datagrid>
    </List>
  );
};

export default SavedJobsList;
