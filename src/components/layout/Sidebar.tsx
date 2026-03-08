import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  List,
  Users,
  PiggyBank,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/add-expense", label: "Add Expense", icon: Plus },
  { path: "/expenses", label: "Expenses", icon: List },
  { path: "/groups", label: "Groups", icon: Users },
  { path: "/budget", label: "Budget", icon: PiggyBank },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const displayName = user?.name || user?.username || user?.email || "Guest User";
  const userInitials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen flex flex-col transition-all duration-500 ease-in-out z-50",
        "bg-sidebar backdrop-blur-xl border-r border-sidebar-border shadow-2xl",
        collapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      {/* Brand Header */}
      <div className="h-[80px] flex items-center px-5 mb-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-emerald-400 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
              <span className="font-black text-lg tracking-tight text-sidebar-foreground leading-none">Aura Finance</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Smart AI Engine</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation section */}
      <div className="flex-1 px-4 space-y-8 overflow-y-auto no-scrollbar py-4">
        <div>
          {!collapsed && (
            <p className="px-3 mb-4 text-[11px] font-bold text-sidebar-foreground/40 uppercase tracking-[0.2em]">Menu</p>
          )}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              const linkContent = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full animate-in fade-in slide-in-from-left-1 duration-300" />
                  )}
                  
                  <div className={cn(
                    "flex items-center justify-center rounded-lg transition-all duration-300",
                    isActive ? "text-primary" : "group-hover:text-sidebar-foreground"
                  )}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  {!collapsed && (
                    <span className={cn(
                      "font-semibold text-sm transition-all duration-300",
                      isActive ? "translate-x-0.5" : "group-hover:translate-x-1"
                    )}>
                      {item.label}
                    </span>
                  )}

                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                  )}
                </NavLink>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="bg-primary text-primary-foreground font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 border-none">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Profile Section */}
      <div className="p-4 mt-auto border-t border-sidebar-border/50">
        <div className={cn(
          "rounded-2xl transition-all duration-500",
          collapsed ? "bg-transparent" : "bg-sidebar-accent/30 p-3 border border-sidebar-border/50 shadow-sm"
        )}>
          {user && (
            <div className={cn(
              "flex items-center gap-3",
              collapsed ? "justify-center" : ""
            )}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none group">
                    <Avatar className={cn(
                      "transition-transform duration-300 group-hover:scale-105 border-2 border-sidebar-border shadow-sm",
                      collapsed ? "w-10 h-10" : "w-10 h-10"
                    )}>
                      <AvatarImage src="/bykhalid.jpeg" />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{userInitials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side={collapsed ? "right" : "top"} align="end" className="w-56 p-2 rounded-xl shadow-2xl border-sidebar-border bg-sidebar text-sidebar-foreground">
                  <DropdownMenuLabel className="font-bold flex items-center gap-2">
                    <User size={16} /> My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-sidebar-border" />
                  <DropdownMenuItem className="rounded-lg cursor-pointer py-2 font-medium focus:bg-sidebar-accent">
                    <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                    <span>Security Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-sidebar-border" />
                  <DropdownMenuItem onClick={logout} className="rounded-lg cursor-pointer py-2 font-medium text-red-400 focus:text-red-400 focus:bg-red-400/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {!collapsed && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <p className="text-sm font-bold text-sidebar-foreground truncate leading-none mb-1">
                    {displayName}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">Online</p>
                  </div>
                </div>
              )}
              
              {!collapsed && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/40 hover:text-sidebar-foreground">
                        <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="end" className="w-40 p-1 rounded-lg bg-sidebar border-sidebar-border">
                      <DropdownMenuItem onClick={logout} className="text-red-400 font-bold text-xs uppercase tracking-wider rounded-md focus:bg-red-400/10">
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              )}
            </div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={onToggle}
          className={cn(
            "mt-4 w-full h-10 flex items-center justify-center rounded-xl transition-all duration-300",
            "bg-sidebar-accent/50 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground group"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Collapse View</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
