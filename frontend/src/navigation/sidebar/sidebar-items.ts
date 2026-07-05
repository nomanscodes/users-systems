import {
  LayoutDashboard,
  Settings2,
  GraduationCap,
  BookMarked,
  Users,
  Briefcase,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Main",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Configuration",
    items: [
      {
        id: "class-configure",
        title: "Class Configure",
        url: "/dashboard/class-configure",
        icon: Settings2,
      },
      {
        id: "academic-setup",
        title: "Academic Setup",
        url: "/dashboard/academic-setup",
        icon: GraduationCap,
      },
      {
        id: "subject-allocations",
        title: "Subject Allocations",
        url: "/dashboard/subject-allocations",
        icon: BookMarked,
      },
    ],
  },
  {
    id: 3,
    label: "People",
    items: [
      {
        id: "staff-directory",
        title: "Staff Directory",
        url: "/dashboard/staff",
        icon: Users,
      },
      {
        id: "designations",
        title: "Designations",
        url: "/dashboard/staff/designations",
        icon: Briefcase,
      },
    ],
  },
  {
    id: 4,
    label: "Access Control",
    items: [
      {
        id: "roles",
        title: "Roles & Permissions",
        url: "/dashboard/roles",
        icon: ShieldCheck,
      },
    ],
  },
];
