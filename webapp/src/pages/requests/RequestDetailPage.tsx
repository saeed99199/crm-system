import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  Pencil,
  Upload,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  uploadedAt: string;
}

interface Activity {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: { id: string; name: string } | null;
}

interface Contract {
  id: string;
  contractNumber: string;
  amount: number;
  status: string;
}

interface RequestDetail {
  id: string;
  requestNumber: string;
  customer: Customer;
  financingType: string;
  requestedAmount: number;
  approvedAmount: number | null;
  financingEntity: string | null;
  status: string;
  internalNotes: string | null;
  rejectionReason: string | null;
  assignedEmployee: Employee | null;
  submissionDate: string;
  approvalDate: string | null;
  completionDate: string | null;
  createdAt: string;
  documents: Document[];
  activities: Activity[];
  contract: Contract | null;
}

const statusLabels: Record<string, string> = {
  new: "جديد",
  under_review: "قيد المراجعة",
  documents_required: "مطلوب مستندات",
  approved: "موافق عليه",
  rejected: "مرفوض",
  completed: "مكتمل",
};

const typeLabels: Record<string, string> = {
  personal: "شخصي",
  mortgage: "عقاري",
  car: "سيارات",
  business: "تجاري",
  education: "تعليمي",
  other: "أخرى",
};

const statusIcons: Record<string, React.ReactNode> = {
  new: <Clock className="h-4 w-4" />,
  under_review: <AlertCircle className="h-4 w-4" />,
  documents_required: <FileText className="h-4 w-4" />,
  approved: <CheckCircle2 className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: () => api.get<RequestDetail>(`/api/requests/${id}`),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string; approvedAmount?: number; rejectionReason?: string }) =>
      api.patch(`/api/requests/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["request", id] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setStatusDialogOpen(false);
      toast.success("تم تحديث حالة الطلب بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    },
  });

  const handleStatusChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: { status: string; approvedAmount?: number; rejectionReason?: string } = {
      status: newStatus,
    };

    if (newStatus === "approved") {
      const amount = formData.get("approvedAmount");
      if (amount) data.approvedAmount = parseFloat(amount as string);
    }

    if (newStatus === "rejected") {
      const reason = formData.get("rejectionReason");
      if (reason) data.rejectionReason = reason as string;
    }

    updateStatusMutation.mutate(data);
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

  if (!request) {
    return (
      <div className="page-enter text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">الطلب غير موجود</p>
        <Link to="/requests">
          <Button variant="outline" className="mt-4">
            العودة للطلبات
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
          <Link to="/requests">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{request.requestNumber}</h1>
              <span className={`status-badge status-${request.status}`}>
                {statusIcons[request.status]}
                {statusLabels[request.status]}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {request.customer.name} - {typeLabels[request.financingType]}
            </p>
          </div>
        </div>
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Pencil className="h-4 w-4" />
              تغيير الحالة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تغيير حالة الطلب</DialogTitle>
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

              {newStatus === "approved" && (
                <div>
                  <Label>المبلغ الموافق عليه (ر.س)</Label>
                  <Input
                    name="approvedAmount"
                    type="number"
                    defaultValue={request.requestedAmount}
                    dir="ltr"
                  />
                </div>
              )}

              {newStatus === "rejected" && (
                <div>
                  <Label>سبب الرفض</Label>
                  <Textarea name="rejectionReason" placeholder="أدخل سبب الرفض..." rows={3} />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={!newStatus || updateStatusMutation.isPending}>
                  حفظ
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">تفاصيل الطلب</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">نوع التمويل</p>
                <p className="font-medium">{typeLabels[request.financingType]}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">جهة التمويل</p>
                <p className="font-medium">{request.financingEntity || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المبلغ المطلوب</p>
                <p className="font-medium text-lg tabular-nums-ar">
                  {formatCurrency(request.requestedAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المبلغ الموافق عليه</p>
                <p className="font-medium text-lg tabular-nums-ar text-emerald-400">
                  {request.approvedAmount ? formatCurrency(request.approvedAmount) : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ التقديم</p>
                <p className="font-medium">
                  {format(new Date(request.submissionDate), "d MMMM yyyy", { locale: ar })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الموافقة</p>
                <p className="font-medium">
                  {request.approvalDate
                    ? format(new Date(request.approvalDate), "d MMMM yyyy", { locale: ar })
                    : "-"}
                </p>
              </div>
              {request.internalNotes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">ملاحظات داخلية</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg mt-1">{request.internalNotes}</p>
                </div>
              )}
              {request.rejectionReason && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">سبب الرفض</p>
                  <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-lg mt-1">
                    {request.rejectionReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">المستندات</CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                رفع مستند
              </Button>
            </CardHeader>
            <CardContent>
              {request.documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">لا توجد مستندات</p>
              ) : (
                <div className="space-y-2">
                  {request.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        تحميل
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">سجل النشاط</CardTitle>
            </CardHeader>
            <CardContent>
              {request.activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">لا يوجد نشاط</p>
              ) : (
                <div className="space-y-4">
                  {request.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                          {activity.user && ` - ${activity.user.name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                  <p className="font-medium">{request.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.customer.type === "company" ? "شركة" : "فرد"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm tabular-nums-ar">{request.customer.phone}</span>
              </div>
              {request.customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{request.customer.email}</span>
                </div>
              )}
              {(request.customer.nationalId || request.customer.commercialReg) && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm tabular-nums-ar">
                    {request.customer.nationalId || request.customer.commercialReg}
                  </span>
                </div>
              )}
              <Link to={`/customers/${request.customer.id}`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  عرض ملف العميل
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Contract Info */}
          {request.contract && (
            <Card className="border-border/50 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-base text-emerald-400">العقد</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">رقم العقد</span>
                  <span className="font-mono text-sm">{request.contract.contractNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">المبلغ</span>
                  <span className="font-medium tabular-nums-ar">
                    {formatCurrency(request.contract.amount)}
                  </span>
                </div>
                <Link to={`/contracts/${request.contract.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    عرض العقد
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Assigned Employee */}
          {request.assignedEmployee && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">الموظف المسؤول</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{request.assignedEmployee.name}</p>
                    <p className="text-xs text-muted-foreground">{request.assignedEmployee.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
