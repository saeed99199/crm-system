import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background bg-pattern">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />

      <Sidebar />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={cn(
          "min-h-screen transition-all duration-300 relative z-10",
          isMobile
            ? "mr-0 ml-0 pt-14"
            : isRTL
            ? "md:mr-[70px] lg:mr-[260px]"
            : "md:ml-[70px] lg:ml-[260px]"
        )}
      >
        <div className="p-3 md:p-4 lg:p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
