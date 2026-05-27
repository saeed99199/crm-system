import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  ScrollText,
  Eye,
  FileText,
  Calendar,
  DollarSign,
  MoreVertical,
  Pencil,
  Trash2,
  FilePlus2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { CreateContractDialog } from "./CreateContractDialog";
import { EditContractDialog } from "./EditContractDialog";
import { DeleteContractDialog } from "./DeleteContractDialog";
import { StatusChangeDropdown } from "./StatusChangeDropdown";
import { usePermissions } from "@/lib/permissions";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Request {
  id: string;
  requestNumber: string;
  financingType: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  customer: Customer;
  request: Request;
  amount: number;
  interestRate?: number;
  duration: number;
  monthlyPayment: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(
    null
  );
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission("contracts:create");
  const canEdit = hasPermission("contracts:edit");
  const canDelete = hasPermission("contracts:delete");

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts", { search, status: statusFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      return api.get<Contract[]>(`/api/contracts?${params.toString()}`);
    },
  });

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة العقود</h1>
          <p className="text-muted-foreground text-sm mt-1">
            متابعة وإدارة عقود التمويل
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <>
              <Link to="/contracts/create-brokerage">
                <Button variant="outline" className="gap-2">
                  <FilePlus2 className="h-4 w-4" />
                  عقد وساطة تمويلية
                </Button>
              </Link>
              <CreateContractDialog />
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم العقد أو اسم العميل..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="حالة العقد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="pending_signature">
                  بانتظار التوقيع
                </SelectItem>
                <SelectItem value="signed">موقع</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !contracts?.length ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <ScrollText className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">لا توجد عقود</p>
            <p className="text-sm text-muted-foreground mt-2">
              يمكنك إنشاء عقد جديد من الزر أعلاه
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((contract) => (
            <Card
              key={contract.id}
              className="border-border/50 hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-muted-foreground tabular-nums-ar">
                      {contract.contractNumber}
                    </p>
                    <p className="font-semibold mt-1 truncate">
                      {contract.customer.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[contract.status]}>
                      {statusLabels[contract.status]}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => setEditingContract(contract)}
                          >
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل العقد
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingContract(contract)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف العقد
                            </DropdownMenuItem>
                          </>
                        )}
                        {!canEdit && !canDelete && (
                          <DropdownMenuItem disabled className="text-muted-foreground">
                            <Lock className="h-4 w-4 ml-2" />
                            لا تملك صلاحية التعديل
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">المبلغ:</span>
                    <span className="font-medium tabular-nums-ar">
                      {formatCurrency(contract.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">المدة:</span>
                    <span className="tabular-nums-ar">
                      {contract.duration} شهر
                    </span>
                  </div>

                  {contract.monthlyPayment ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        القسط الشهري:
                      </span>
                      <span className="font-medium tabular-nums-ar">
                        {formatCurrency(contract.monthlyPayment)}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                  {canEdit && (
                    <StatusChangeDropdown
                      contractId={contract.id}
                      currentStatus={contract.status}
                    />
                  )}
                  <Link to={`/contracts/${contract.id}`} className={canEdit ? "flex-1" : "w-full"}>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="h-4 w-4" />
                      عرض التفاصيل
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingContract ? (
        <EditContractDialog
          contract={editingContract}
          open={!!editingContract}
          onOpenChange={(open) => {
            if (!open) setEditingContract(null);
          }}
        />
      ) : null}

      {/* Delete Dialog */}
      {deletingContract ? (
        <DeleteContractDialog
          contractId={deletingContract.id}
          contractNumber={deletingContract.contractNumber}
          open={!!deletingContract}
          onOpenChange={(open) => {
            if (!open) setDeletingContract(null);
          }}
        />
      ) : null}
    </div>
  );
}
