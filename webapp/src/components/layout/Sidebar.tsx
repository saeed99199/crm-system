import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  ScrollText,
  UserCog,
  Building2,
  ChevronLeft,
  LogOut,
  Calculator,
  User,
  Shield,
  Globe,
  Menu,
  X,
  Sun,
  Moon,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions, type Permission } from "@/lib/permissions";
import { useIsMobile } from "@/hooks/use-mobile";
import { getTheme, toggleTheme, type Theme } from "@/lib/theme";

type NavItem = {
  nameKey: string;
  href: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
};

const navigation: NavItem[] = [
  { nameKey: "nav.dashboard", href: "/", icon: LayoutDashboard, permission: "dashboard:view" },
  { nameKey: "nav.customers", href: "/customers", icon: Users, permission: "customers:view" },
  { nameKey: "nav.requests", href: "/requests", icon: FileText, permission: "requests:view" },
  { nameKey: "nav.kanban", href: "/requests/kanban", icon: LayoutGrid, permission: "requests:view" },
  { nameKey: "nav.contracts", href: "/contracts", icon: ScrollText, permission: "contracts:view" },
  { nameKey: "nav.employees", href: "/employees", icon: UserCog, permission: "employees:view" },
  { nameKey: "nav.entities", href: "/entities", icon: Building2, permission: "entities:view" },
  { nameKey: "nav.calculator", href: "/calculator", icon: Calculator, permission: "calculator:view" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { data: session } = useSession();
  const { t, i18n } = useTranslation();
  const { hasPermission, hiddenPages } = usePermissions();

  const currentLang = i18n.language as "ar" | "en";
  const isRTL = currentLang === "ar";

  const [theme, setThemeState] = useState<Theme>(getTheme);

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setThemeState(next);
  };

  // Auto-collapse on tablet (768px–1023px)
  useEffect(() => {
    if (window.innerWidth < 1024 && window.innerWidth >= 768) {
      setCollapsed(true);
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const toggleLanguage = () => {
    const newLang = currentLang === "ar" ? "en" : "ar";
    changeLanguage(newLang);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const user = session?.user;

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 70 },
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: isRTL ? 20 : -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut" as const,
      },
    }),
  };

  // Whether to show labels (always show in mobile drawer, respect collapsed on desktop)
  const showLabels = isMobile ? true : !collapsed;

  const sidebarContent = (
    <>
      {/* Logo & Collapse Toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {showLabels ? (
            <motion.div
              key="full-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <img
                src="https://ssffc.com.sa/wp-content/uploads/2024/12/logo-2.png"
                alt="الحلول الذكية"
                className="w-10 h-10 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {t("company.name")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("company.subtitle")}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="mini-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto"
            >
              <img
                src="https://ssffc.com.sa/wp-content/uploads/2024/12/logo-2.png"
                alt="الحلول الذكية"
                className="w-10 h-10 object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 text-muted-foreground hover:text-foreground transition-all duration-300",
              collapsed &&
                cn(
                  "absolute top-4 bg-sidebar border border-sidebar-border rounded-full shadow-md hover:shadow-lg",
                  isRTL ? "-left-3" : "-right-3"
                )
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                collapsed && "rotate-180",
                !isRTL && "rotate-180",
                !isRTL && collapsed && "rotate-0"
              )}
            />
          </Button>
        )}
      </div>

      {/* Language Toggle */}
      <div className="px-3 py-2 border-b border-sidebar-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleLanguage}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                "bg-secondary/50 hover:bg-secondary text-foreground transition-all duration-300",
                !showLabels && "justify-center px-2"
              )}
            >
              <Globe className="h-4 w-4 text-primary" />
              {showLabels && (
                <span className="flex items-center gap-2">
                  <span className={cn(currentLang === "ar" && "text-primary font-semibold")}>
                    AR
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className={cn(currentLang === "en" && "text-primary font-semibold")}>
                    EN
                  </span>
                </span>
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side={isRTL ? "left" : "right"}>
            {t("language.switchTo")} {currentLang === "ar" ? "English" : "العربية"}
          </TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleToggleTheme}
              className={cn(
                "mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                "bg-secondary/50 hover:bg-secondary text-foreground transition-all duration-300",
                !showLabels && "justify-center px-2"
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-4 w-4 text-amber-400" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-4 w-4 text-slate-500" />
                  </motion.span>
                )}
              </AnimatePresence>
              {showLabels && (
                <span>
                  {theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
                </span>
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side={isRTL ? "left" : "right"}>
            {theme === "dark" ? "التبديل للوضع النهاري" : "التبديل للوضع الليلي"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3">
        {navigation
          .filter((item) => !item.permission || hasPermission(item.permission))
          .filter((item) => !hiddenPages.has(item.nameKey.replace("nav.", "")))
          .map((item, index) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));

          return (
            <motion.div
              key={item.nameKey}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={navItemVariants}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.href}
                    className={cn("sidebar-item group", isActive && "active")}
                    onClick={() => isMobile && setMobileOpen(false)}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors duration-300",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                    </motion.div>
                    <AnimatePresence>
                      {showLabels && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="whitespace-nowrap overflow-hidden"
                        >
                          {t(item.nameKey)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                </TooltipTrigger>
                {!showLabels && (
                  <TooltipContent side={isRTL ? "left" : "right"}>
                    {t(item.nameKey)}
                  </TooltipContent>
                )}
              </Tooltip>
            </motion.div>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border space-y-2">
        {/* User Profile */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "sidebar-item w-full",
                  !showLabels && "justify-center"
                )}
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(user.name || "U")}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {showLabels && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className={cn(
                        "flex-1 min-w-0",
                        isRTL ? "text-right" : "text-left"
                      )}
                    >
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isRTL ? "end" : "start"}
              className="w-56"
            >
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(user.name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <Shield className="h-4 w-4" />
                <span>
                  {t("roles.role")}:{" "}
                  {t(
                    `roles.${(user as { role?: string }).role || "employee"}`
                  )}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => navigate("/profile")}
              >
                <User className="h-4 w-4" />
                <span>{t("pages.profile.title")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>{t("pages.auth.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Logout Button (when collapsed or no user) */}
        {(!user || !showLabels) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className={cn(
                  "sidebar-item w-full text-destructive hover:text-destructive hover:bg-destructive/10",
                  !showLabels && "justify-center",
                  user && showLabels && "hidden"
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <AnimatePresence>
                  {showLabels && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                    >
                      {t("pages.auth.logout")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            {!showLabels && (
              <TooltipContent side={isRTL ? "left" : "right"}>
                {t("pages.auth.logout")}
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-14 bg-background/95 backdrop-blur border-b border-border flex items-center px-4 md:hidden">
        <div className="flex items-center gap-3 flex-1">
          <img
            src="https://ssffc.com.sa/wp-content/uploads/2024/12/logo-2.png"
            alt="الحلول الذكية"
            className="w-8 h-8 object-contain"
          />
          <span className="text-sm font-semibold text-foreground">
            {t("company.name")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      {isMobile ? (
        /* Mobile: CSS-transition drawer from right (RTL) or left (LTR) */
        <aside
          className={cn(
            "fixed top-0 z-40 h-screen w-[260px] bg-sidebar border-sidebar-border transition-transform duration-300",
            isRTL ? "right-0 border-l" : "left-0 border-r",
            mobileOpen
              ? "translate-x-0"
              : isRTL
              ? "translate-x-full"
              : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>
      ) : (
        /* Tablet/Desktop: framer-motion animated width */
        <motion.aside
          initial={false}
          animate={collapsed ? "collapsed" : "expanded"}
          variants={sidebarVariants}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "fixed top-0 z-40 h-screen bg-sidebar border-sidebar-border transition-colors duration-300",
            isRTL ? "right-0 border-l" : "left-0 border-r"
          )}
        >
          {sidebarContent}
        </motion.aside>
      )}
    </>
  );
}
