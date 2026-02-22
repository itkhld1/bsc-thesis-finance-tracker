import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  List,
  Users, // Used for Profile icon now
  PiggyBank,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
  LogOut,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/add-expense", label: "Add Expense", icon: Plus },
  { path: "/expenses", label: "Expenses", icon: List },
  { path: "/groups", label: "Groups", icon: Users },
  { path: "/budget", label: "Budget", icon: PiggyBank },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/profile", label: "Profile", icon: Users }, // Using Users icon for Profile
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 border-r border-sidebar-border z-40",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <Wallet className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-lg text-sidebar-foreground">FinanceAI</h1>
            <p className="text-xs text-sidebar-foreground/60">Smart Tracking</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const linkContent = (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium animate-fade-in">{item.label}</span>
              )}
            </NavLink>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* User and Logout */}
      {user && ( // Only show user info and logout if user is logged in
        <div className="border-t flex p-3 border-sidebar-border">
          {!collapsed && ( // Only show user info and logout if user is logged in and sidebar is expanded
            <div className="flex-1 flex justify-between items-center ml-3 animate-fade-in">
              <div className="leading-4">
                <h4 className="font-semibold text-sidebar-foreground">{user.name || user.username || user.email}</h4>
                <span className="text-xs text-muted-foreground">ID: {user.id}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <MoreVertical size={20} className="text-sidebar-foreground/70 hover:text-sidebar-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-40">
                  <DropdownMenuItem onClick={logout} className="flex items-center text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {collapsed && ( // Show only Logout icon if collapsed and user is logged in
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full">
                  <LogOut className="text-sidebar-foreground/70 hover:text-sidebar-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-40">
                <DropdownMenuItem onClick={logout} className="flex items-center text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}