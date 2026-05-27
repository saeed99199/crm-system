import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  UserCog,
  Shield,
  Mail,
  Calendar,
  FileText,
  Pencil,
  Trash2,
  UserPlus,
  Key,
  Eye,
  EyeOff,
  Lock,
  Settings2,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePermissions } from "@/lib/permissions";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  hiddenPages: string | null;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  _count?: { assignedRequests: number };
}

const ALL_PAGES = [
  { key: "dashboard", label: "لوحة التحكم" },
  { key: "customers", label: "العملاء" },
  { key: "requests", label: "الطلبات" },
  { key: "contracts", label: "العقود" },
  { key: "employees", label: "الموظفين" },
  { key: "entities", label: "جهات التمويل" },
  { key: "calculator", label: "الحاسبة" },
  { key: "settings", label: "الإعدادات" },
];

function getHiddenPagesSet(hiddenPages: string | null): Set<string> {
  if (!hiddenPages) return new Set();
  return new Set(hiddenPages.split(",").filter(Boolean));
}

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [settingsEmployee, setSettingsEmployee] = useState<Employee | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [hiddenPagesState, setHiddenPagesState] = useState<Set<string>>(new Set());

  const canCreate = hasPermission("employees:create");
  const canEdit = hasPermission("employees:edit");
  const canDelete = hasPermission("employees:delete");

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees", { search, role: roleFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      return api.get<Employee[]>(`/api/employees?${params.toString()}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string }) =>
      api.post<Employee>("/api/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsDialogOpen(false);
      toast.success("تم إضافة الموظف بنجاح");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "حدث خطأ أثناء إضافة الموظف";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      api.put<Employee>(`/api/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      toast.success("تم تحديث بيانات الموظف بنجاح");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "حدث خطأ أثناء تحديث البيانات";
      toast.error(message);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/api/employees/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("تم تحديث صلاحيات الموظف بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الصلاحيات");
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/api/employees/${id}/password`, { password }),
    onSuccess: () => {
      setNewPassword("");
      toast.success("تم تغيير كلمة المرور بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تغيير كلمة المرور");
    },
  });

  const updateHiddenPagesMutation = useMutation({
    mutationFn: ({ id, hiddenPages }: { id: string; hiddenPages: string }) =>
      api.patch(`/api/employees/${id}/hidden-pages`, { hiddenPages }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("تم تحديث صلاحيات الصفحات بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث الصفحات");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("تم حذف الموظف بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الموظف");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (editingEmployee) {
      const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        role: formData.get("role") as string,
      };
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        role: formData.get("role") as string,
      };
      createMutation.mutate(data);
    }
  };

  const handlePasswordSubmit = () => {
    if (!settingsEmployee) return;
    if (newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    updatePasswordMutation.mutate({ id: settingsEmployee.id, password: newPassword });
  };

  const handleHiddenPagesSubmit = () => {
    if (!settingsEmployee) return;
    const hiddenPages = Array.from(hiddenPagesState).join(",");
    updateHiddenPagesMutation.mutate({ id: settingsEmployee.id, hiddenPages });
  };

  const openSettingsDialog = (employee: Employee) => {
    setSettingsEmployee(employee);
    setHiddenPagesState(getHiddenPagesSet(employee.hiddenPages));
    setNewPassword("");
    setShowPassword(false);
    setIsSettingsDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
  };

  const togglePage = (pageKey: string) => {
    setHiddenPagesState((prev) => {
      const next = new Set(prev);
      if (next.has(pageKey)) {
        next.delete(pageKey);
      } else {
        next.add(pageKey);
      }
      return next;
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الموظفين</h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة المستخدمين وصلاحياتهم
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) closeDialog();
          else setIsDialogOpen(true);
        }}>
          {canCreate && (
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                إضافة موظف
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={editingEmployee?.name || ""}
                    placeholder="أدخل اسم الموظف"
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    defaultValue={editingEmployee?.email || ""}
                    placeholder="employee@company.com"
                    dir="ltr"
                  />
                </div>
                {!editingEmployee && (
                  <div>
                    <Label htmlFor="password">كلمة المرور *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="كلمة المرور (6 أحرف على الأقل)"
                      dir="ltr"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="role">الصلاحية *</Label>
                  <Select name="role" defaultValue={editingEmployee?.role || "employee"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير</SelectItem>
                      <SelectItem value="manager">مشرف</SelectItem>
                      <SelectItem value="employee">موظف</SelectItem>
                      <SelectItem value="viewer">مشاهد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingEmployee ? "حفظ التعديلات" : "إضافة الموظف"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Settings Dialog (Password + Page Visibility) */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              إعدادات الموظف: {settingsEmployee?.name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="pages" dir="rtl">
            <TabsList className="w-full">
              <TabsTrigger value="pages" className="flex-1">
                الصفحات المرئية
              </TabsTrigger>
              <TabsTrigger value="password" className="flex-1">
                تغيير كلمة المرور
              </TabsTrigger>
            </TabsList>

            {/* Page Visibility Tab */}
            <TabsContent value="pages" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                اختر الصفحات التي يمكن للموظف رؤيتها. الصفحات غير المحددة ستُخفى من القائمة.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ALL_PAGES.map((page) => {
                  const isVisible = !hiddenPagesState.has(page.key);
                  return (
                    <div
                      key={page.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isVisible
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/50 bg-muted/30"
                      }`}
                      onClick={() => togglePage(page.key)}
                    >
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={() => togglePage(page.key)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm font-medium">{page.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleHiddenPagesSubmit}
                  disabled={updateHiddenPagesMutation.isPending}
                >
                  حفظ الصفحات
                </Button>
              </div>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                تغيير كلمة المرور للموظف: <span className="font-medium text-foreground">{settingsEmployee?.name}</span>
              </p>
              <div>
                <Label htmlFor="newPassword">كلمة المرور الجديدة *</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)"
                    dir="ltr"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={updatePasswordMutation.isPending}
                >
                  <Key className="h-4 w-4 ml-2" />
                  تغيير كلمة المرور
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو البريد الإلكتروني..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصلاحيات</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="manager">مشرف</SelectItem>
                <SelectItem value="employee">موظف</SelectItem>
                <SelectItem value="viewer">مشاهد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !employees?.length ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <UserCog className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">لا يوجد موظفين</p>
            <Button className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
              <UserPlus className="h-4 w-4" />
              إضافة موظف جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((employee) => {
            const hidden = getHiddenPagesSet(employee.hiddenPages);
            const visibleCount = ALL_PAGES.length - hidden.size;
            return (
              <Card key={employee.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={employee.image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{employee.name}</p>
                        {employee.emailVerified && (
                          <Shield className="h-4 w-4 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-1">
                        <Mail className="h-3 w-3" />
                        {employee.email}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="إعدادات (كلمة المرور + الصفحات)"
                          onClick={() => openSettingsDialog(employee)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="تعديل"
                          onClick={() => openEditDialog(employee)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="حذف"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
                              deleteMutation.mutate(employee.id);
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
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">الصلاحية:</span>
                      <Select
                        value={employee.role}
                        onValueChange={(role) =>
                          updateRoleMutation.mutate({ id: employee.id, role })
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مدير</SelectItem>
                          <SelectItem value="manager">مشرف</SelectItem>
                          <SelectItem value="employee">موظف</SelectItem>
                          <SelectItem value="viewer">مشاهد</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Eye className="h-3 w-3" />
                        الصفحات المرئية:
                      </span>
                      <span className="text-xs font-medium">
                        {visibleCount} / {ALL_PAGES.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3 w-3" />
                        الطلبات المسندة:
                      </span>
                      <span className="tabular-nums-ar font-medium">
                        {employee._count?.assignedRequests || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        تاريخ الإنضمام:
                      </span>
                      <span className="text-xs">
                        {format(new Date(employee.createdAt), "d MMM yyyy", { locale: ar })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
