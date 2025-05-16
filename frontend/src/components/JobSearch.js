const handleSearch = async () => {
  try {
    setLoading(true);
    setError(null);
    setJobs([]);
    setStats(null);

    console.log("Starting job search with:", {
      keywords: searchKeywords,
      location: location,
      hours: hours
    });

    const response = await fetch(`${API_URL}/api/jobs/fetch-with-params`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keywords: searchKeywords,
        location: location,
        hours: hours,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.details || "Failed to fetch jobs");
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch jobs");
    }

    console.log("Received job data:", data);

    setJobs(data.data.jobs);
    setStats(data.data.stats);
    setShowResults(true);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    setError(error.message);
    setJobs([]);
    setStats(null);
  } finally {
    setLoading(false);
  }
}; 