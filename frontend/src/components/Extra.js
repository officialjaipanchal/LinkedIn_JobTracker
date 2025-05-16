// import React, { useState, useEffect } from "react";
// import {
//   Show,
//   useRecordContext,
//   useNotify,
//   Button,
//   useRedirect,
// } from "react-admin";
// import {
//   Card,
//   CardContent,
//   Typography,
//   Grid,
//   Chip,
//   Box,
//   IconButton,
//   Divider,
//   Paper,
//   Fade,
//   Zoom,
//   Tooltip,
//   LinearProgress,
//   Skeleton,
//   Slide,
// } from "@mui/material";
// import {
//   Work as WorkIcon,
//   Business as BusinessIcon,
//   LocationOn as LocationIcon,
//   AttachMoney as SalaryIcon,
//   Star as StarIcon,
//   Schedule as ScheduleIcon,
//   Link as LinkIcon,
//   Share as ShareIcon,
//   Bookmark as BookmarkIcon,
//   BookmarkBorder as BookmarkBorderIcon,
//   ArrowBack as ArrowBackIcon,
//   CalendarToday as CalendarIcon,
//   Update as UpdateIcon,
// } from "@mui/icons-material";
// import { MatchScoreField } from "./MatchScoreField";
// import { MatchedKeywordsField } from "./MatchedKeywordsField";
// import { AnalyticsField } from "./AnalyticsField";

// const LoadingSkeleton = () => (
//   <Box sx={{ maxWidth: 1200, margin: "0 auto", padding: 3 }}>
//     <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
//     <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
//       <Grid container spacing={2}>
//         <Grid item xs={12} md={8}>
//           <Skeleton variant="text" height={60} width="80%" sx={{ mb: 1 }} />
//           <Skeleton variant="text" height={40} width="60%" sx={{ mb: 2 }} />
//           <Skeleton variant="text" height={30} width="40%" />
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
//             <Skeleton
//               variant="rectangular"
//               width={120}
//               height={40}
//               sx={{ borderRadius: 2 }}
//             />
//             <Skeleton variant="circular" width={40} height={40} />
//             <Skeleton variant="circular" width={40} height={40} />
//           </Box>
//         </Grid>
//       </Grid>
//     </Paper>
//     <Grid container spacing={3}>
//       <Grid item xs={12} md={8}>
//         <Skeleton
//           variant="rectangular"
//           height={200}
//           sx={{ borderRadius: 2, mb: 3 }}
//         />
//         <Skeleton
//           variant="rectangular"
//           height={300}
//           sx={{ borderRadius: 2, mb: 3 }}
//         />
//         <Grid container spacing={3}>
//           <Grid item xs={12} md={6}>
//             <Skeleton
//               variant="rectangular"
//               height={150}
//               sx={{ borderRadius: 2 }}
//             />
//           </Grid>
//           <Grid item xs={12} md={6}>
//             <Skeleton
//               variant="rectangular"
//               height={150}
//               sx={{ borderRadius: 2 }}
//             />
//           </Grid>
//         </Grid>
//       </Grid>
//       <Grid item xs={12} md={4}>
//         <Skeleton
//           variant="rectangular"
//           height={200}
//           sx={{ borderRadius: 2, mb: 3 }}
//         />
//         <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
//       </Grid>
//     </Grid>
//   </Box>
// );

// const JobShowContent = () => {
//   const record = useRecordContext();
//   const notify = useNotify();
//   const redirect = useRedirect();
//   const [isSaved, setIsSaved] = useState(record?.saved || false);
//   const [loading, setLoading] = useState(true);
//   const [showContent, setShowContent] = useState(false);

//   useEffect(() => {
//     // Initial loading state
//     const loadingTimer = setTimeout(() => {
//       setLoading(false);
//     }, 1000);

//     // Stagger the content appearance
//     const contentTimer = setTimeout(() => {
//       setShowContent(true);
//     }, 1200);

//     return () => {
//       clearTimeout(loadingTimer);
//       clearTimeout(contentTimer);
//     };
//   }, []);

//   if (!record) return null;

//   const handleApply = () => {
//     if (record.url) {
//       window.open(record.url, "_blank");
//     } else {
//       notify("No application URL available", { type: "warning" });
//     }
//   };

//   const handleSave = () => {
//     setIsSaved(!isSaved);
//     notify(isSaved ? "Job removed from saved jobs" : "Job saved successfully", {
//       type: "success",
//     });
//   };

//   const handleShare = () => {
//     if (navigator.share) {
//       navigator
//         .share({
//           title: `${record.title} at ${record.company}`,
//           text: `Check out this job: ${record.title} at ${record.company}`,
//           url: record.url,
//         })
//         .catch((error) => console.log("Error sharing", error));
//     } else {
//       navigator.clipboard.writeText(record.url);
//       notify("Job URL copied to clipboard", { type: "success" });
//     }
//   };

//   const handleBack = () => {
//     redirect("list", "jobs");
//   };

//   if (loading) {
//     return <LoadingSkeleton />;
//   }

//   return (
//     <Slide direction="up" in={showContent} timeout={500}>
//       <Box sx={{ maxWidth: 1200, margin: "0 auto", padding: 3 }}>
//         <Fade in={showContent} timeout={800}>
//           <Box>
//             <Tooltip title="Back to Jobs List">
//               <IconButton
//                 onClick={handleBack}
//                 sx={{
//                   mb: 2,
//                   bgcolor: "background.paper",
//                   boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//                   "&:hover": {
//                     bgcolor: "background.paper",
//                     transform: "scale(1.1)",
//                   },
//                   transition: "all 0.2s ease",
//                 }}
//                 color="primary"
//               >
//                 <ArrowBackIcon />
//               </IconButton>
//             </Tooltip>

//             <Paper
//               elevation={3}
//               sx={{
//                 padding: 3,
//                 marginBottom: 3,
//                 background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
//                 borderLeft: "4px solid #1976d2",
//                 transition: "transform 0.3s ease-in-out",
//                 "&:hover": {
//                   transform: "translateY(-4px)",
//                 },
//               }}
//             >
//               <Grid container spacing={2} alignItems="center">
//                 <Grid item xs={12} md={8}>
//                   <Typography
//                     variant="h4"
//                     component="h1"
//                     gutterBottom
//                     sx={{
//                       fontWeight: 600,
//                       color: "#1a237e",
//                       textShadow: "1px 1px 1px rgba(0,0,0,0.1)",
//                     }}
//                   >
//                     {record.title}
//                   </Typography>
//                   <Typography variant="h5" color="primary" gutterBottom>
//                     <BusinessIcon sx={{ mr: 1, verticalAlign: "middle" }} />
//                     {record.company}
//                   </Typography>
//                   <Box
//                     sx={{
//                       display: "flex",
//                       gap: 2,
//                       alignItems: "center",
//                       mb: 2,
//                       flexWrap: "wrap",
//                     }}
//                   >
//                     <Typography variant="body1" color="text.secondary">
//                       <LocationIcon sx={{ mr: 0.5, verticalAlign: "middle" }} />
//                       {record.location}
//                     </Typography>
//                     {record.isRemote && (
//                       <Chip
//                         label="Remote"
//                         color="success"
//                         size="small"
//                         sx={{
//                           fontWeight: "bold",
//                           background:
//                             "linear-gradient(45deg, #4caf50 30%, #81c784 90%)",
//                           color: "white",
//                         }}
//                       />
//                     )}
//                     <Chip
//                       icon={<CalendarIcon />}
//                       label={`Posted: ${new Date(
//                         record.datePosted
//                       ).toLocaleDateString()}`}
//                       variant="outlined"
//                       size="small"
//                     />
//                     <Chip
//                       icon={<UpdateIcon />}
//                       label={`Updated: ${new Date(
//                         record.lastUpdated
//                       ).toLocaleDateString()}`}
//                       variant="outlined"
//                       size="small"
//                     />
//                   </Box>
//                 </Grid>
//                 <Grid item xs={12} md={4}>
//                   <Box
//                     sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}
//                   >
//                     <Tooltip
//                       title={
//                         record.url
//                           ? "Apply for this job"
//                           : "No application URL available"
//                       }
//                     >
//                       <span>
//                         <Button
//                           variant="contained"
//                           color="primary"
//                           onClick={handleApply}
//                           disabled={!record.url}
//                           startIcon={<LinkIcon />}
//                           sx={{
//                             borderRadius: 2,
//                             textTransform: "none",
//                             fontWeight: "bold",
//                             background:
//                               "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
//                             boxShadow: "0 3px 5px 2px rgba(33, 150, 243, .3)",
//                             "&:hover": {
//                               background:
//                                 "linear-gradient(45deg, #1565c0 30%, #1976d2 90%)",
//                             },
//                           }}
//                         >
//                           Apply Now
//                         </Button>
//                       </span>
//                     </Tooltip>
//                     <Tooltip
//                       title={
//                         isSaved ? "Remove from saved jobs" : "Save this job"
//                       }
//                     >
//                       <IconButton
//                         onClick={handleSave}
//                         color="primary"
//                         sx={{
//                           "&:hover": {
//                             transform: "scale(1.1)",
//                             transition: "transform 0.2s",
//                           },
//                         }}
//                       >
//                         {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
//                       </IconButton>
//                     </Tooltip>
//                     <Tooltip title="Share this job">
//                       <IconButton
//                         onClick={handleShare}
//                         color="primary"
//                         sx={{
//                           "&:hover": {
//                             transform: "scale(1.1)",
//                             transition: "transform 0.2s",
//                           },
//                         }}
//                       >
//                         <ShareIcon />
//                       </IconButton>
//                     </Tooltip>
//                   </Box>
//                 </Grid>
//               </Grid>
//             </Paper>
//           </Box>
//         </Fade>

//         <Grid container spacing={3}>
//           {/* Left Column */}
//           <Grid item xs={12} md={8}>
//             {/* Job Details Card */}
//             <Zoom in={showContent} timeout={900}>
//               <Card
//                 sx={{
//                   marginBottom: 3,
//                   boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//                   "&:hover": {
//                     boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
//                     transform: "translateY(-4px)",
//                   },
//                   transition: "all 0.3s ease",
//                 }}
//               >
//                 <CardContent>
//                   <Typography
//                     variant="h6"
//                     gutterBottom
//                     sx={{ color: "#1976d2" }}
//                   >
//                     Job Details
//                   </Typography>
//                   <Grid container spacing={2}>
//                     <Grid item xs={12} sm={6}>
//                       <Box
//                         sx={{ display: "flex", alignItems: "center", mb: 2 }}
//                       >
//                         <WorkIcon sx={{ mr: 1, color: "primary.main" }} />
//                         <Typography>
//                           <strong>Type:</strong> {record.jobType}
//                         </Typography>
//                       </Box>
//                     </Grid>
//                     <Grid item xs={12} sm={6}>
//                       <Box
//                         sx={{ display: "flex", alignItems: "center", mb: 2 }}
//                       >
//                         <SalaryIcon sx={{ mr: 1, color: "primary.main" }} />
//                         <Typography>
//                           <strong>Salary:</strong>{" "}
//                           {record.salary || "Not specified"}
//                         </Typography>
//                       </Box>
//                     </Grid>
//                     <Grid item xs={12} sm={6}>
//                       <Box
//                         sx={{ display: "flex", alignItems: "center", mb: 2 }}
//                       >
//                         <StarIcon sx={{ mr: 1, color: "primary.main" }} />
//                         <Typography>
//                           <strong>Experience:</strong> {record.experienceLevel}
//                         </Typography>
//                       </Box>
//                     </Grid>
//                     <Grid item xs={12} sm={6}>
//                       <Box
//                         sx={{ display: "flex", alignItems: "center", mb: 2 }}
//                       >
//                         <ScheduleIcon sx={{ mr: 1, color: "primary.main" }} />
//                         <Typography>
//                           <strong>Posted:</strong>{" "}
//                           {new Date(record.datePosted).toLocaleDateString()}
//                         </Typography>
//                       </Box>
//                     </Grid>
//                   </Grid>
//                 </CardContent>
//               </Card>
//             </Zoom>

//             {/* Description Card */}
//             <Zoom in={showContent} timeout={1000}>
//               <Card
//                 sx={{
//                   marginBottom: 3,
//                   boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//                   "&:hover": {
//                     boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
//                     transform: "translateY(-4px)",
//                   },
//                   transition: "all 0.3s ease",
//                 }}
//               >
//                 <CardContent>
//                   <Typography
//                     variant="h6"
//                     gutterBottom
//                     sx={{ color: "#1976d2" }}
//                   >
//                     Job Description
//                   </Typography>
//                   <Typography
//                     variant="body1"
//                     component="div"
//                     sx={{
//                       whiteSpace: "pre-wrap",
//                       "& p": { marginBottom: 2 },
//                       lineHeight: 1.7,
//                       color: "#333",
//                     }}
//                   >
//                     {record.description}
//                   </Typography>
//                 </CardContent>
//               </Card>
//             </Zoom>

//             {/* Requirements and Benefits */}
//             <Grid container spacing={3}>
//               <Grid item xs={12} md={6}>
//                 <Zoom in={showContent} timeout={1100}>
//                   <Card
//                     sx={{
//                       height: "100%",
//                       boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//                       "&:hover": {
//                         boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
//                         transform: "translateY(-4px)",
//                       },
//                       transition: "all 0.3s ease",
//                     }}
//                   >
//                     <CardContent>
//                       <Typography
//                         variant="h6"
//                         gutterBottom
//                         sx={{ color: "#1976d2" }}
//                       >
//                         Requirements
//                       </Typography>
//                       <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
//                         {record.requirements?.map((req, index) => (
//                           <Chip
//                             key={index}
//                             label={req.text}
//                             variant="outlined"
//                             sx={{
//                               margin: 0.5,
//                               borderColor: "#1976d2",
//                               "&:hover": {
//                                 backgroundColor: "rgba(25, 118, 210, 0.08)",
//                               },
//                             }}
//                           />
//                         ))}
//                       </Box>
//                     </CardContent>
//                   </Card>
//                 </Zoom>
//               </Grid>
//               <Grid item xs={12} md={6}>
//                 <Zoom in={showContent} timeout={1200}>
//                   <Card
//                     sx={{
//                       height: "100%",
//                       boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//                       "&:hover": {
//                         boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
//                         transform: "translateY(-4px)",
//                       },
//                       transition: "all 0.3s ease",
//                     }}
//                   >
//                     <CardContent>
//                       <Typography
//                         variant="h6"
//                         gutterBottom
//                         sx={{ color: "#1976d2" }}
//                       >
//                         Benefits
//                       </Typography>
//                       <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
//                         {record.benefits?.map((benefit, index) => (
//                           <Chip
//                             key={index}
//                             label={benefit.text}
//                             color="primary"
//                             variant="outlined"
//                             sx={{
//                               margin: 0.5,
//                               "&:hover": {
//                                 backgroundColor: "rgba(25, 118, 210, 0.08)",
//                               },
//                             }}
//                           />
//                         ))}
//                       </Box>
//                     </CardContent>
//                   </Card>
//                 </Zoom>
//               </Grid>
//             </Grid>
//           </Grid>

//           {/* Right Column */}
//           <Grid item xs={12} md={4}>
//             {/* Match Score Card */}
//             <Zoom in={showContent} timeout={1300}>
//               <Card
//                 sx={{
//                   marginBottom: 3,
//                   boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//                   "&:hover": {
//                     boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
//                     transform: "translateY(-4px)",
//                   },
//                   transition: "all 0.3s ease",
//                 }}
//               >
//                 <CardContent>
//                   <Typography
//                     variant="h6"
//                     gutterBottom
//                     sx={{ color: "#1976d2" }}
//                   >
//                     Match Score
//                   </Typography>
//                   <MatchScoreField />
//                   <Divider sx={{ my: 2 }} />
//                   <Typography variant="subtitle2" gutterBottom>
//                     Matched Keywords
//                   </Typography>
//                   <MatchedKeywordsField />
//                 </CardContent>
//               </Card>
//             </Zoom>

//             {/* Analytics Card */}
//             <Zoom in={showContent} timeout={1400}>
//               <Card
//                 sx={{
//                   boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//                   "&:hover": {
//                     boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
//                     transform: "translateY(-4px)",
//                   },
//                   transition: "all 0.3s ease",
//                 }}
//               >
//                 <CardContent>
//                   <Typography
//                     variant="h6"
//                     gutterBottom
//                     sx={{ color: "#1976d2" }}
//                   >
//                     Analytics
//                   </Typography>
//                   <AnalyticsField />
//                 </CardContent>
//               </Card>
//             </Zoom>
//           </Grid>
//         </Grid>
//       </Box>
//     </Slide>
//   );
// };

// const JobShow = () => (
//   <Show>
//     <JobShowContent />
//   </Show>
// );

// export default JobShow;
