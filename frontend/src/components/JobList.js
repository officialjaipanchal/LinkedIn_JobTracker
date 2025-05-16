import React, { useState, useEffect } from "react";
import {
  List,
  Datagrid,
  TextField,
  DateField,
  SearchInput,
  FilterButton,
  TopToolbar,
  CreateButton,
  ExportButton,
  TextInput,
  Filter,
  SelectInput,
} from "react-admin";
import { Box, Chip } from "@mui/material";
import { JobTypeChip } from "./JobTypeChip";
import { httpClient } from "../utils/httpClient";

const dateFilterChoices = [
  { id: "*", name: "All" },
  { id: "today", name: "Today" },
  { id: "week", name: "This Week" },
  { id: "month", name: "This Month" },
  { id: "older", name: "Older" },
];

const JobFilters = [
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

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFilter: "*", // Default to show all
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get("/jobs", {
        params: {
          ...filters,
          dateFilter: filters.dateFilter || "*", // Ensure dateFilter is always set
        },
      });
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const ListActions = () => (
    <TopToolbar>
      <FilterButton />
      <CreateButton />
      <ExportButton />
    </TopToolbar>
  );

  return (
    <List
      filters={JobFilters}
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
      </Datagrid>
    </List>
  );
};

export default JobList;
