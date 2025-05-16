import React, { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Bookmark as BookmarkIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Description as DescriptionIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

const drawerWidth = 240;

const CustomLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Available Jobs", icon: <WorkIcon />, path: "/jobs" },
    { text: "Applied Jobs", icon: <CheckCircleIcon />, path: "/applied-jobs" },
    { text: "Saved Jobs", icon: <BookmarkIcon />, path: "/saved-jobs" },
    {
      text: "Not Interested",
      icon: <BlockIcon />,
      path: "/not-interested-jobs",
    },
    { text: "Resume Analysis", icon: <DescriptionIcon />, path: "/resume" },
  ];

  const drawer = (
    <Box sx={{ overflow: "auto" }}>
      {/* App Title */}
      <Box sx={{ p: 2, borderBottom: "1px solid rgba(0, 0, 0, 0.12)" }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ color: theme.palette.primary.main }}
        >
          Job Tracker
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            sx={{
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
              "&.active": {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
              borderRadius: "8px",
              m: 1,
              width: "auto",
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.primary.main }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile menu button */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: "fixed",
            left: 0,
            top: 0,
            m: 1,
            zIndex: theme.zIndex.drawer + 2,
            backgroundColor: "white",
            boxShadow: 1,
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            backgroundColor: theme.palette.background.default,
            boxShadow: 3,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            backgroundColor: theme.palette.background.default,
            boxShadow: 3,
            border: "none",
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          mt: { xs: 7, md: 0 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default CustomLayout;
