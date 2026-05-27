import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowRight,
  ScrollText,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  Pencil,
  Percent,
  Clock,
  FileText,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  type: string;
  nationalId: string | null;
  commercialReg: string | null;
}

interface Request {
  id: string;
  requestNumber: string;
  financingType: string;
  requestedAmount: number;
  status: string;
}

interface Activity {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: { id: string; name: string } | null;
}

interface ContractDetail {
  id: string;
  contractNumber: string;
  customer: Customer;
  request: Request;
  amount: number;
  interestRate: number | null;
  duration: number;
  monthlyPayment: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  signedAt: string | null;
  fileUrl: string | null;
  createdAt: string;
  activities?: Activity[];
}

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending_signature: "بانتظار التوقيع",
  signed: "موقع",
  active: "نشط",
  completed: "مكتمل",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_signature: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  signed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  completed: "bg-teal-500/15 text-teal-400 border-teal-500/30",
};

const typeLabels: Record<string, string> = {
  personal: "شخصي",
  mortgage: "عقاري",
  car: "سيارات",
  business: "تجاري",
  education: "تعليمي",
  other: "أخرى",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => api.get<ContractDetail>(`/api/contracts/${id}`),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string }) =>
      api.patch(`/api/contracts/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setStatusDialogOpen(false);
      toast.success("تم تحديث حالة العقد بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });

  const handleStatusChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateStatusMutation.mutate({ status: newStatus });
  };

  const handlePrintContract = () => {
    if (!contract) return;
    const params = new URLSearchParams({
      contractNumber: contract.contractNumber,
      companyName: contract.customer.name,
      commercialReg: contract.customer.commercialReg ?? "",
      nationalId: contract.customer.nationalId ?? "",
      mobile: contract.customer.phone ?? "",
      amount: String(contract.amount),
      duration: String(contract.duration),
      financingType: contract.request?.financingType ?? "",
    });
    navigate(`/contracts/create-brokerage?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="page-enter space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="page-enter text-center py-12">
        <ScrollText className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">العقد غير موجود</p>
        <Link to="/contracts">
          <Button variant="outline" className="mt-4">
            العودة للعقود
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/contracts">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground font-mono">
                {contract.contractNumber}
              </h1>
              <Badge className={statusColors[contract.status]}>
                {statusLabels[contract.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {contract.customer.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrintContract}>
            <Printer className="h-4 w-4" />
            طباعة العقد
          </Button>
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Pencil className="h-4 w-4" />
              تغيير الحالة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تغيير حالة العقد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleStatusChange} className="space-y-4">
              <div>
                <Label>الحالة الجديدة</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={!newStatus || updateStatusMutation.isPending}
                >
                  حفظ
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Details */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">تفاصيل العقد</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  مبلغ التمويل
                </p>
                <p className="font-medium text-lg tabular-nums-ar">
                  {formatCurrency(contract.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  مدة العقد
                </p>
                <p className="font-medium tabular-nums-ar">
                  {contract.duration} شهر
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  القسط الشهري
                </p>
                <p className="font-medium text-lg tabular-nums-ar text-primary">
                  {contract.monthlyPayment
                    ? formatCurrency(contract.monthlyPayment)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  معدل الربح
                </p>
                <p className="font-medium tabular-nums-ar">
                  {contract.interestRate ? `${contract.interestRate}%` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  تاريخ البدء
                </p>
                <p className="font-medium">
                  {contract.startDate
                    ? format(new Date(contract.startDate), "d MMMM yyyy", {
                        locale: ar,
                      })
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  تاريخ الانتهاء
                </p>
                <p className="font-medium">
                  {contract.endDate
                    ? format(new Date(contract.endDate), "d MMMM yyyy", {
                        locale: ar,
                      })
                    : "-"}
                </p>
              </div>
              {contract.signedAt && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">تاريخ التوقيع</p>
                  <p className="font-medium">
                    {format(new Date(contract.signedAt), "d MMMM yyyy", {
                      locale: ar,
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Financing Request */}
          <Card className="border-border/50 border-primary/30">
            <CardHeader>
              <CardTitle className="text-base text-primary">
                طلب التمويل المرتبط
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">رقم الطلب</span>
                <span className="font-mono text-sm">
                  {contract.request.requestNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  نوع التمويل
                </span>
                <span className="text-sm">
                  {typeLabels[contract.request.financingType]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  المبلغ المطلوب
                </span>
                <span className="font-medium tabular-nums-ar">
                  {formatCurrency(contract.request.requestedAmount)}
                </span>
              </div>
              <Link to={`/requests/${contract.request.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  عرض الطلب
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Activity Log */}
          {contract.activities && contract.activities.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">سجل النشاط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                          {activity.user ? ` - ${activity.user.name}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">معلومات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{contract.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.customer.type === "company" ? "شركة" : "فرد"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm tabular-nums-ar">
                  {contract.customer.phone}
                </span>
              </div>
              {contract.customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{contract.customer.email}</span>
                </div>
              )}
              {(contract.customer.nationalId ||
                contract.customer.commercialReg) && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm tabular-nums-ar">
                    {contract.customer.nationalId ||
                      contract.customer.commercialReg}
                  </span>
                </div>
              )}
              <Link to={`/customers/${contract.customer.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  عرض ملف العميل
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Contract File */}
          {contract.fileUrl && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">ملف العقد</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={contract.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    تحميل العقد
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
