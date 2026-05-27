import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Plus,
  Search,
  FileText,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
  MoreHorizontal,
  Lock,
  Upload,
  X,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { usePermissions } from "@/lib/permissions";

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface FinancingRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  customer: Customer;
  financingType: string;
  requestedAmount: number;
  approvedAmount: number | null;
  financingEntity: string | null;
  status: string;
  internalNotes: string | null;
  assignedEmployee: Employee | null;
  createdAt: string;
  _count?: { documents: number };
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
  new: <Clock className="h-3 w-3" />,
  under_review: <AlertCircle className="h-3 w-3" />,
  documents_required: <FileText className="h-3 w-3" />,
  approved: <CheckCircle2 className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
  completed: <CheckCircle2 className="h-3 w-3" />,
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function RequestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<FinancingRequest | null>(null);
  const [dialogStep, setDialogStep] = useState<"form" | "documents">("form");
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<{ type: string; file: File | null }[]>([
    { type: "national_id", file: null },
    { type: "commercial_reg", file: null },
    { type: "deed", file: null },
    { type: "other", file: null },
  ]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("requests:create");
  const canEdit = hasPermission("requests:edit");
  const canDelete = hasPermission("requests:delete");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["requests", { search, status: statusFilter, type: typeFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      return api.get<FinancingRequest[]>(`/api/requests?${params.toString()}`);
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-list"],
    queryFn: () => api.get<Customer[]>("/api/customers"),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      customerId: string;
      financingType: string;
      requestedAmount: number;
      financingEntity?: string;
      internalNotes?: string;
    }) => api.post<FinancingRequest>("/api/requests", data),
    onSuccess: (newRequest) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setCreatedRequestId(newRequest.id);
      setDialogStep("documents");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إنشاء الطلب");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FinancingRequest> }) =>
      api.put<FinancingRequest>(`/api/requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setIsDialogOpen(false);
      setEditingRequest(null);
      toast.success("تم تحديث الطلب بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الطلب");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("تم حذف الطلب بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الطلب");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: formData.get("customerId") as string,
      financingType: formData.get("financingType") as string,
      requestedAmount: parseFloat(formData.get("requestedAmount") as string),
      financingEntity: (formData.get("financingEntity") as string) || undefined,
      internalNotes: (formData.get("internalNotes") as string) || undefined,
    };

    if (editingRequest) {
      updateMutation.mutate({ id: editingRequest.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (request: FinancingRequest) => {
    setEditingRequest(request);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRequest(null);
    setDialogStep("form");
    setCreatedRequestId(null);
    setDocFiles([
      { type: "national_id", file: null },
      { type: "commercial_reg", file: null },
      { type: "deed", file: null },
      { type: "other", file: null },
    ]);
  };

  const docTypeLabels: Record<string, string> = {
    national_id: "الهوية الوطنية",
    commercial_reg: "السجل التجاري",
    deed: "الصكوك",
    other: "أخرى",
  };

  const handleDocFileChange = (type: string, file: File | null) => {
    setDocFiles((prev) => prev.map((d) => (d.type === type ? { ...d, file } : d)));
  };

  const handleUploadDocuments = async () => {
    if (!createdRequestId) return;
    const toUpload = docFiles.filter((d) => d.file !== null);
    if (toUpload.length === 0) {
      toast.success("تم إنشاء الطلب بنجاح");
      closeDialog();
      return;
    }

    setUploadingDocs(true);
    let successCount = 0;
    for (const doc of toUpload) {
      if (!doc.file) continue;
      try {
        const formData = new FormData();
        formData.append("file", doc.file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error?.message || "فشل رفع الملف");
        const fileUrl = uploadData.data?.url || uploadData.url;
        await api.post("/api/documents", {
          name: doc.file.name,
          type: doc.type,
          fileUrl,
          fileSize: doc.file.size,
          requestId: createdRequestId,
        });
        successCount++;
      } catch {
        toast.error(`فشل رفع ${docTypeLabels[doc.type]}`);
      }
    }
    setUploadingDocs(false);
    if (successCount > 0) {
      toast.success(`تم إنشاء الطلب ورفع ${successCount} مستند بنجاح`);
    } else {
      toast.success("تم إنشاء الطلب بنجاح");
    }
    queryClient.invalidateQueries({ queryKey: ["requests"] });
    closeDialog();
  };

  const statusCounts = requests?.reduce(
    (acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">طلبات التمويل</h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة ومتابعة جميع طلبات التمويل
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) closeDialog();
          else setIsDialogOpen(true);
        }}>
          {canCreate && (
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                طلب جديد
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRequest
                  ? "تعديل طلب التمويل"
                  : dialogStep === "form"
                  ? "إنشاء طلب تمويل جديد"
                  : "رفع المستندات"}
              </DialogTitle>
              {!editingRequest && dialogStep === "documents" && (
                <p className="text-xs text-muted-foreground mt-1">
                  تم إنشاء الطلب بنجاح. يمكنك رفع المستندات الآن أو تخطي هذه الخطوة.
                </p>
              )}
            </DialogHeader>

            {/* Step indicator for new request */}
            {!editingRequest && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={`flex items-center gap-1 ${dialogStep === "form" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${dialogStep === "form" ? "bg-primary text-white" : "bg-green-500 text-white"}`}>
                    {dialogStep === "documents" ? <CheckCircle className="h-3 w-3" /> : "1"}
                  </div>
                  بيانات الطلب
                </div>
                <div className="h-px flex-1 bg-border" />
                <div className={`flex items-center gap-1 ${dialogStep === "documents" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${dialogStep === "documents" ? "bg-primary text-white" : "bg-border text-muted-foreground"}`}>
                    2
                  </div>
                  رفع المستندات
                </div>
              </div>
            )}

            {/* Step 1: Form */}
            {(editingRequest || dialogStep === "form") && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customerId">العميل *</Label>
                    <Select name="customerId" defaultValue={editingRequest?.customerId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر العميل" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="financingType">نوع التمويل *</Label>
                    <Select name="financingType" defaultValue={editingRequest?.financingType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع التمويل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">تمويل شخصي</SelectItem>
                        <SelectItem value="mortgage">تمويل عقاري</SelectItem>
                        <SelectItem value="car">تمويل سيارات</SelectItem>
                        <SelectItem value="business">تمويل تجاري</SelectItem>
                        <SelectItem value="education">تمويل تعليمي</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="requestedAmount">المبلغ المطلوب (ر.س) *</Label>
                    <Input
                      id="requestedAmount"
                      name="requestedAmount"
                      type="number"
                      required
                      min="1000"
                      defaultValue={editingRequest?.requestedAmount || ""}
                      placeholder="أدخل المبلغ"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="financingEntity">جهة التمويل</Label>
                    <Input
                      id="financingEntity"
                      name="financingEntity"
                      defaultValue={editingRequest?.financingEntity || ""}
                      placeholder="اسم البنك أو جهة التمويل"
                    />
                  </div>
                  <div>
                    <Label htmlFor="internalNotes">ملاحظات داخلية</Label>
                    <Textarea
                      id="internalNotes"
                      name="internalNotes"
                      defaultValue={editingRequest?.internalNotes || ""}
                      placeholder="ملاحظات للموظفين..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingRequest ? "حفظ التعديلات" : "التالي: رفع المستندات"}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Documents upload */}
            {!editingRequest && dialogStep === "documents" && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {docFiles.map((doc) => (
                    <div key={doc.type} className="space-y-1">
                      <Label className="text-sm">{docTypeLabels[doc.type]}</Label>
                      {doc.file ? (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs text-foreground truncate flex-1">{doc.file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDocFileChange(doc.type, null)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-2 p-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                          onClick={() => fileInputRefs.current[doc.type]?.click()}
                        >
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">اضغط لاختيار ملف</span>
                        </div>
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[doc.type] = el; }}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleDocFileChange(doc.type, e.target.files?.[0] || null)}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { toast.success("تم إنشاء الطلب بنجاح"); closeDialog(); }}
                  >
                    تخطي
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUploadDocuments}
                    disabled={uploadingDocs || docFiles.every((d) => !d.file)}
                  >
                    {uploadingDocs ? "جاري الرفع..." : "رفع المستندات وإنهاء"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
          className="gap-2"
        >
          الكل
          <span className="tabular-nums-ar bg-background/20 px-1.5 py-0.5 rounded text-xs">
            {requests?.length || 0}
          </span>
        </Button>
        {Object.entries(statusLabels).map(([status, label]) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="gap-2"
          >
            {statusIcons[status]}
            {label}
            <span className="tabular-nums-ar bg-background/20 px-1.5 py-0.5 rounded text-xs">
              {statusCounts[status] || 0}
            </span>
          </Button>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الطلب أو اسم العميل..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نوع التمويل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="personal">شخصي</SelectItem>
                <SelectItem value="mortgage">عقاري</SelectItem>
                <SelectItem value="car">سيارات</SelectItem>
                <SelectItem value="business">تجاري</SelectItem>
                <SelectItem value="education">تعليمي</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !requests?.length ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">لا توجد طلبات</p>
              <Button className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                إنشاء طلب جديد
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>نوع التمويل</th>
                    <th>المبلغ المطلوب</th>
                    <th>الحالة</th>
                    <th>جهة التمويل</th>
                    <th>التاريخ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="font-mono text-xs tabular-nums-ar">
                        {request.requestNumber}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{request.customer.name}</p>
                          <p className="text-xs text-muted-foreground tabular-nums-ar">
                            {request.customer.phone}
                          </p>
                        </div>
                      </td>
                      <td>{typeLabels[request.financingType] || request.financingType}</td>
                      <td className="tabular-nums-ar font-medium">
                        {formatCurrency(request.requestedAmount)}
                      </td>
                      <td>
                        <span className={`status-badge status-${request.status}`}>
                          {statusIcons[request.status]}
                          {statusLabels[request.status] || request.status}
                        </span>
                      </td>
                      <td className="text-muted-foreground">
                        {request.financingEntity || "-"}
                      </td>
                      <td className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(request.createdAt), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/requests/${request.id}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                معاينة
                              </Link>
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem onClick={() => openEditDialog(request)} className="gap-2">
                                <Pencil className="h-4 w-4" />
                                تعديل
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive gap-2"
                                  onClick={() => {
                                    if (confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
                                      deleteMutation.mutate(request.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  حذف
                                </DropdownMenuItem>
                              </>
                            )}
                            {!canEdit && !canDelete && (
                              <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
                                <Lock className="h-4 w-4" />
                                لا تملك صلاحية التعديل
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
