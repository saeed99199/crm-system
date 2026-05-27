import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import {
  ArrowRight,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Upload,
  Download,
  Trash2,
  Clock,
  Eye,
  StickyNote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Customer {
  id: string;
  name: string;
  nationalId: string | null;
  commercialReg: string | null;
  phone: string;
  email: string | null;
  type: "individual" | "company";
  address: string | null;
  notes: string | null;
  createdAt: string;
}

interface CustomerRequest {
  id: string;
  requestNumber: string;
  financingType: string;
  requestedAmount: number;
  status: string;
  submissionDate: string;
}

interface CustomerDocument {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  individual: "فرد",
  company: "شركة",
};

const financingTypeLabels: Record<string, string> = {
  personal: "شخصي",
  mortgage: "عقاري",
  car: "سيارات",
  business: "تجاري",
  education: "تعليمي",
  other: "اخرى",
};

const statusLabels: Record<string, string> = {
  new: "جديد",
  under_review: "قيد المراجعة",
  documents_required: "مطلوب مستندات",
  approved: "موافق عليه",
  rejected: "مرفوض",
  completed: "مكتمل",
};

const documentTypeLabels: Record<string, string> = {
  national_id: "صورة الهوية",
  commercial_reg: "صورة السجل التجاري",
  salary_cert: "شهادة الراتب",
  bank_statement: "كشف حساب بنكي",
  other: "اخرى",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [documentName, setDocumentName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => api.get<Customer>(`/api/customers/${id}`),
    enabled: !!id,
  });

  const { data: requests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["customer-requests", id],
    queryFn: () => api.get<CustomerRequest[]>(`/api/requests?customerId=${id}`),
    enabled: !!id,
  });

  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["customer-documents", id],
    queryFn: () => api.get<CustomerDocument[]>(`/api/customer-documents/customer/${id}`),
    enabled: !!id,
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (docId: string) => api.delete(`/api/customer-documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-documents", id] });
      toast.success("تم حذف المستند بنجاح");
    },
    onError: () => {
      toast.error("حدث خطا اثناء حذف المستند");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !documentName) {
      toast.error("الرجاء تعبئة جميع الحقول");
      return;
    }

    setIsUploading(true);
    try {
      const uploadResult = await uploadFile(selectedFile);

      await api.post("/api/customer-documents", {
        name: documentName,
        type: documentType,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.sizeBytes,
        customerId: id,
      });

      queryClient.invalidateQueries({ queryKey: ["customer-documents", id] });
      toast.success("تم رفع المستند بنجاح");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentType("");
      setDocumentName("");
    } catch (error) {
      toast.error("حدث خطا اثناء رفع المستند");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (doc: CustomerDocument) => {
    window.open(doc.fileUrl, "_blank");
  };

  const handleDeleteDocument = (docId: string) => {
    if (confirm("هل انت متاكد من حذف هذا المستند؟")) {
      deleteDocumentMutation.mutate(docId);
    }
  };

  if (isLoadingCustomer) {
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

  if (!customer) {
    return (
      <div className="page-enter text-center py-12">
        <User className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">العميل غير موجود</p>
        <Link to="/customers">
          <Button variant="outline" className="mt-4">
            العودة للعملاء
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/customers">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${customer.type === "company" ? "bg-purple-500/10" : "bg-primary/10"}`}>
            {customer.type === "company" ? (
              <Building2 className="h-6 w-6 text-purple-400" />
            ) : (
              <User className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
              <Badge variant="secondary">{typeLabels[customer.type]}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              عميل منذ {format(new Date(customer.createdAt), "MMMM yyyy", { locale: ar })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">بيانات العميل</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">رقم الجوال</p>
                  <p className="font-medium tabular-nums-ar">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">البريد الالكتروني</p>
                  <p className="font-medium">{customer.email || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {customer.type === "company" ? "السجل التجاري" : "رقم الهوية"}
                  </p>
                  <p className="font-medium tabular-nums-ar">
                    {customer.type === "company"
                      ? customer.commercialReg || "-"
                      : customer.nationalId || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">العنوان</p>
                  <p className="font-medium">{customer.address || "-"}</p>
                </div>
              </div>
              {customer.notes && (
                <div className="md:col-span-2 flex items-start gap-3">
                  <StickyNote className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">ملاحظات</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg mt-1">{customer.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Requests */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">طلبات العميل</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !requests?.length ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="mt-3 text-muted-foreground">لا توجد طلبات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <Link key={request.id} to={`/requests/${request.id}`}>
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{request.requestNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {financingTypeLabels[request.financingType] || request.financingType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="font-medium tabular-nums-ar">
                              {formatCurrency(request.requestedAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(request.submissionDate), "d MMM yyyy", { locale: ar })}
                            </p>
                          </div>
                          <span className={`status-badge status-${request.status}`}>
                            {statusLabels[request.status] || request.status}
                          </span>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Documents */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">مستندات العميل</CardTitle>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    رفع مستند
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>رفع مستند جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>نوع المستند</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المستند" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(documentTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>اسم المستند</Label>
                      <Input
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="ادخل اسم المستند"
                      />
                    </div>
                    <div>
                      <Label>الملف</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        {selectedFile ? (
                          <div>
                            <FileText className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">
                              اضغط لاختيار ملف او اسحب الملف هنا
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PDF, PNG, JPG, DOC (حد اقصى 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadDialogOpen(false);
                        setSelectedFile(null);
                        setDocumentType("");
                        setDocumentName("");
                      }}
                    >
                      الغاء
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || !selectedFile || !documentType || !documentName}
                    >
                      {isUploading ? "جاري الرفع..." : "رفع المستند"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !documents?.length ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="mt-3 text-muted-foreground">لا توجد مستندات</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    رفع اول مستند
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{documentTypeLabels[doc.type] || doc.type}</span>
                            <span>-</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={deleteDocumentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">ملخص</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">عدد الطلبات</span>
                <span className="font-medium tabular-nums-ar">{requests?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">عدد المستندات</span>
                <span className="font-medium tabular-nums-ar">{documents?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">تاريخ التسجيل</span>
                <span className="font-medium">
                  {format(new Date(customer.createdAt), "d MMM yyyy", { locale: ar })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">اجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4" />
                رفع مستند
              </Button>
              <Link to="/requests" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  انشاء طلب جديد
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
