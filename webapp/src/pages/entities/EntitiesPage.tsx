import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Plus,
  Search,
  Building2,
  Landmark,
  Building,
  ToggleRight,
  Pencil,
  Trash2,
  Lock,
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { usePermissions } from "@/lib/permissions";

interface FinancingEntity {
  id: string;
  name: string;
  type: "bank" | "finance_company" | "government";
  logo: string | null;
  contactInfo: string | null;
  isActive: boolean;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  bank: "بنك",
  finance_company: "شركة تمويل",
  government: "جهة حكومية",
};

const typeIcons: Record<string, React.ReactNode> = {
  bank: <Landmark className="h-5 w-5" />,
  finance_company: <Building className="h-5 w-5" />,
  government: <Building2 className="h-5 w-5" />,
};

export function EntitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<FinancingEntity | null>(null);
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("entities:create");
  const canEdit = hasPermission("entities:edit");
  const canDelete = hasPermission("entities:delete");

  const { data: entities, isLoading } = useQuery({
    queryKey: ["entities", { type: typeFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      return api.get<FinancingEntity[]>(`/api/entities?${params.toString()}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: string; contactInfo?: string }) =>
      api.post<FinancingEntity>("/api/entities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      setIsDialogOpen(false);
      toast.success("تم إضافة الجهة بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة الجهة");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FinancingEntity> }) =>
      api.put<FinancingEntity>(`/api/entities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      setIsDialogOpen(false);
      setEditingEntity(null);
      toast.success("تم تحديث بيانات الجهة بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث البيانات");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/entities/${id}/toggle`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/entities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      toast.success("تم حذف الجهة بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الجهة");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      type: formData.get("type") as "bank" | "finance_company" | "government",
      contactInfo: (formData.get("contactInfo") as string) || undefined,
    };

    if (editingEntity) {
      updateMutation.mutate({ id: editingEntity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (entity: FinancingEntity) => {
    setEditingEntity(entity);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEntity(null);
  };

  const filteredEntities = entities?.filter((entity) =>
    entity.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">جهات التمويل</h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة البنوك وشركات التمويل المعتمدة
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) closeDialog();
            else setIsDialogOpen(true);
          }}
        >
          {canCreate && (
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة جهة
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEntity ? "تعديل بيانات الجهة" : "إضافة جهة تمويل جديدة"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم الجهة *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={editingEntity?.name || ""}
                    placeholder="أدخل اسم الجهة"
                  />
                </div>
                <div>
                  <Label htmlFor="type">نوع الجهة *</Label>
                  <Select name="type" defaultValue={editingEntity?.type || "bank"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">بنك</SelectItem>
                      <SelectItem value="finance_company">شركة تمويل</SelectItem>
                      <SelectItem value="government">جهة حكومية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contactInfo">معلومات التواصل</Label>
                  <Input
                    id="contactInfo"
                    name="contactInfo"
                    defaultValue={editingEntity?.contactInfo || ""}
                    placeholder="رقم الهاتف أو البريد الإلكتروني"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingEntity ? "حفظ التعديلات" : "إضافة الجهة"}
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
                  placeholder="بحث باسم الجهة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نوع الجهة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="bank">بنوك</SelectItem>
                <SelectItem value="finance_company">شركات تمويل</SelectItem>
                <SelectItem value="government">جهات حكومية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Entities Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !filteredEntities?.length ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">لا توجد جهات تمويل</p>
            {canCreate && (
              <Button className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                إضافة جهة جديدة
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntities.map((entity) => (
            <Card
              key={entity.id}
              className={`border-border/50 transition-all ${!entity.isActive && "opacity-60"}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${entity.type === "bank" ? "bg-primary/10 text-primary" : entity.type === "finance_company" ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {typeIcons[entity.type]}
                    </div>
                    <div>
                      <p className="font-semibold">{entity.name}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {typeLabels[entity.type]}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={entity.isActive}
                    onCheckedChange={() => toggleMutation.mutate(entity.id)}
                    disabled={!canEdit}
                  />
                </div>

                {entity.contactInfo && (
                  <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/50">
                    {entity.contactInfo}
                  </p>
                )}

                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(entity)}
                    >
                      <Pencil className="h-4 w-4 ml-2" />
                      تعديل
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("هل أنت متأكد من حذف هذه الجهة؟")) {
                          deleteMutation.mutate(entity.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {!canEdit && !canDelete && (
                    <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <Lock className="h-4 w-4" />
                      <span>للعرض فقط</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
