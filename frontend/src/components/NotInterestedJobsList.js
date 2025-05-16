import React, { useState, useCallback, useEffect } from "react";
import { Button, useNotify, useRefresh } from "react-admin";
import { useMediaQuery } from "@mui/material";
import { Link } from "react-router-dom";
import { httpClient } from "../utils/httpClient";
import { JobTypeChip } from "./JobTypeChip";

const NotInterestedJobsList = () => {
  const isSmall = useMediaQuery("(max-width:960px)");
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const notify = useNotify();
  const refresh = useRefresh();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  // ... copy the rest of the NotInterestedJobsList component code here ...
};

export default NotInterestedJobsList;
