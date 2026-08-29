import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("pages/home.tsx"),
  route("login", "pages/login.tsx"),
  route("add", "pages/add.tsx"),
  route("browse", "pages/browse.tsx"),
  route("colors", "pages/colors.tsx"),
  route("edit", "pages/edit.tsx"),
  route("report", "pages/report.tsx"),
  route("help", "pages/help.tsx"),
  route("admin", "pages/admin.tsx"),
] satisfies RouteConfig;