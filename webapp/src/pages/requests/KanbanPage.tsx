import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  User,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import type { FinancingRequest } from "../../../../backend/src/types";

type RequestStatus =
  | "new"
  | "under_review"
  | "documents_required"
  | "approved"
  | "rejected"
  | "completed";

interface RequestWithCustomer extends FinancingRequest {
  customer?: { id: string; name: string; phone: string; type: string };
}

const COLUMNS: {
  status: RequestStatus;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  dot: string;
}[] = [
  {
    status: "new",
    label: "جديد",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  {
    status: "under_review",
    label: "قيد المراجعة",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  {
    status: "documents_required",
    label: "مطلوب مستندات",
    icon: AlertCircle,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  {
    status: "approved",
    label: "معتمد",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    dot: "bg-green-500",
  },
  {
    status: "rejected",
    label: "مرفوض",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
  {
    status: "completed",
    label: "مكتمل",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
];

const FINANCING_TYPE_LABELS: Record<string, string> = {
  personal: "شخصي",
  mortgage: "عقاري",
  car: "سيارة",
  business: "تجاري",
  education: "تعليمي",
  other: "أخرى",
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function KanbanCard({
  request,
  onDragStart,
}: {
  request: RequestWithCustomer;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, request.id)}
      className="cursor-grab active:cursor-grabbing"
    >
      <Link to={`/requests/${request.id}`}>
        <Card className="group hover:shadow-md transition-all duration-200 border border-border/60 hover:border-primary/30 bg-card">
          <CardContent className="p-3 space-y-2.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                {request.requestNumber}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                {FINANCING_TYPE_LABELS[request.financingType] ?? request.financingType}
              </Badge>
            </div>

            {/* Customer */}
            {request.customer && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">{request.customer.name}</span>
              </div>
            )}

            {/* Amount */}
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground font-semibold">
                {formatAmount(request.requestedAmount)}
              </span>
            </div>

            {/* Entity */}
            {request.financingEntity && (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {request.financingEntity}
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="pt-1 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(request.createdAt), {
                  addSuffix: true,
                  locale: arLocale,
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function KanbanColumn({
  col,
  requests,
  onDragStart,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver,
}: {
  col: (typeof COLUMNS)[number];
  requests: RequestWithCustomer[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, status: RequestStatus) => void;
  onDragOver: (e: React.DragEvent, status: RequestStatus) => void;
  onDragLeave: () => void;
  isDragOver: boolean;
}) {
  const Icon = col.icon;
  return (
    <div
      className={`flex flex-col min-w-[260px] w-[260px] rounded-xl border transition-all duration-200 ${col.bg} ${col.border} ${isDragOver ? "ring-2 ring-primary/40 scale-[1.01]" : ""}`}
      onDrop={(e) => onDrop(e, col.status)}
      onDragOver={(e) => onDragOver(e, col.status)}
      onDragLeave={onDragLeave}
    >
      {/* Column Header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 border-b ${col.border}`}>
        <div className={`w-2 h-2 rounded-full ${col.dot}`} />
        <Icon className={`h-4 w-4 ${col.color}`} />
        <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
        <span className="mr-auto text-xs bg-background/70 border border-border/50 rounded-full px-2 py-0.5 font-medium">
          {requests.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 min-h-[120px]">
        <AnimatePresence>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/50">
              <FolderOpen className="h-7 w-7 mb-1" />
              <span className="text-xs">لا توجد طلبات</span>
            </div>
          ) : (
            requests.map((req) => (
              <KanbanCard key={req.id} request={req} onDragStart={onDragStart} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function KanbanPage() {
  const queryClient = useQueryClient();
  const dragId = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<RequestStatus | null>(null);

  const { data: requests = [], isLoading } = useQuery<RequestWithCustomer[]>({
    queryKey: ["requests", "kanban"],
    queryFn: () => api.get<RequestWithCustomer[]>("/api/requests"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      api.patch(`/api/requests/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: () => toast.error("فشل تحديث حالة الطلب"),
  });

  const grouped = COLUMNS.reduce(
    (acc, col) => {
      acc[col.status] = requests.filter((r) => r.status === col.status);
      return acc;
    },
    {} as Record<RequestStatus, RequestWithCustomer[]>
  );

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: RequestStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(status);
  };

  const handleDragLeave = () => setDragOverCol(null);

  const handleDrop = (e: React.DragEvent, status: RequestStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!dragId.current) return;
    const req = requests.find((r) => r.id === dragId.current);
    if (!req || req.status === status) return;
    updateStatus.mutate({ id: dragId.current, status });
    dragId.current = null;
  };

  const totalAmount = requests.reduce((s, r) => s + r.requestedAmount, 0);

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card/50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">لوحة الكانبان</h1>
              <p className="text-xs text-muted-foreground">تتبع طلبات التمويل بالسحب والإفلات</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-foreground">{requests.length}</div>
              <div className="text-xs text-muted-foreground">إجمالي الطلبات</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="font-bold text-foreground">{formatAmount(totalAmount)}</div>
              <div className="text-xs text-muted-foreground">إجمالي المبالغ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4">
        {isLoading ? (
          <div className="flex gap-3">
            {COLUMNS.map((col) => (
              <div key={col.status} className="min-w-[260px] w-[260px] space-y-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 pb-4" style={{ minWidth: "max-content" }}>
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                col={col}
                requests={grouped[col.status] ?? []}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                isDragOver={dragOverCol === col.status}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
