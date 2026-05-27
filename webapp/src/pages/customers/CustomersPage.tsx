import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Search, Users, Building2, Phone, Mail, Eye, Pencil, Trash2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { usePermissions } from "@/lib/permissions";

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
  _count?: { requests: number };
}

const typeLabels: Record<string, string> = {
  individual: "فرد",
  company: "شركة",
};

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("customers:create");
  const canEdit = hasPermission("customers:edit");
  const canDelete = hasPermission("customers:delete");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", { search, type: typeFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (typeFilter !== "all") params.append("type", typeFilter);
      return api.get<Customer[]>(`/api/customers?${params.toString()}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => api.post<Customer>("/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsDialogOpen(false);
      toast.success("تم إضافة العميل بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة العميل");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      api.put<Customer>(`/api/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsDialogOpen(false);
      setEditingCustomer(null);
      toast.success("تم تحديث بيانات العميل بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث البيانات");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("تم حذف العميل بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف العميل");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string || undefined,
      type: formData.get("type") as "individual" | "company",
      nationalId: formData.get("nationalId") as string || undefined,
      commercialReg: formData.get("commercialReg") as string || undefined,
      address: formData.get("address") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة العملاء</h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة بيانات العملاء وطلباتهم
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
                إضافة عميل
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">اسم العميل *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={editingCustomer?.name || ""}
                    placeholder="أدخل اسم العميل"
                  />
                </div>
                <div>
                  <Label htmlFor="type">نوع العميل *</Label>
                  <Select name="type" defaultValue={editingCustomer?.type || "individual"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">فرد</SelectItem>
                      <SelectItem value="company">شركة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">رقم الجوال *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    defaultValue={editingCustomer?.phone || ""}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="nationalId">رقم الهوية</Label>
                  <Input
                    id="nationalId"
                    name="nationalId"
                    defaultValue={editingCustomer?.nationalId || ""}
                    placeholder="رقم الهوية الوطنية"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="commercialReg">السجل التجاري</Label>
                  <Input
                    id="commercialReg"
                    name="commercialReg"
                    defaultValue={editingCustomer?.commercialReg || ""}
                    placeholder="رقم السجل التجاري"
                    dir="ltr"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingCustomer?.email || ""}
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={editingCustomer?.address || ""}
                    placeholder="عنوان العميل"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={editingCustomer?.notes || ""}
                    placeholder="أي ملاحظات إضافية..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCustomer ? "حفظ التعديلات" : "إضافة العميل"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو الجوال أو الهوية..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نوع العميل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="individual">أفراد</SelectItem>
                <SelectItem value="company">شركات</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !customers?.length ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">لا يوجد عملاء</p>
              {canCreate && (
                <Button className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  إضافة عميل جديد
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>العميل</th>
                    <th>النوع</th>
                    <th>الهوية/السجل</th>
                    <th>التواصل</th>
                    <th>الطلبات</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${customer.type === "company" ? "bg-purple-500/10" : "bg-primary/10"}`}>
                            {customer.type === "company" ? (
                              <Building2 className="h-4 w-4 text-purple-400" />
                            ) : (
                              <Users className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.address && (
                              <p className="text-xs text-muted-foreground">{customer.address}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="secondary">
                          {typeLabels[customer.type]}
                        </Badge>
                      </td>
                      <td className="tabular-nums-ar text-sm">
                        {customer.type === "company"
                          ? customer.commercialReg || "-"
                          : customer.nationalId || "-"}
                      </td>
                      <td>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="tabular-nums-ar">{customer.phone}</span>
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="text-xs">{customer.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="tabular-nums-ar">{customer._count?.requests || 0}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link to={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(customer)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
                                  deleteMutation.mutate(customer.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {!canEdit && !canDelete && (
                            <span title="لا تملك صلاحية التعديل">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </span>
                          )}
                        </div>
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
