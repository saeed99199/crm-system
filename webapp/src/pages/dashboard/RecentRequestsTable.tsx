import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface RecentRequest {
  id: string;
  requestNumber: string;
  customer: Customer;
  financingType: string;
  requestedAmount: number;
  status: string;
  createdAt: string;
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function RecentRequestsTable() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ["dashboard-recent-requests"],
    queryFn: () => api.get<RecentRequest[]>("/api/dashboard/recent-requests"),
  });

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">أحدث الطلبات</CardTitle>
        <Link to="/requests">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            عرض الكل
            <ArrowLeft className="h-4 w-4 mr-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !requests?.length ? (
          <div className="py-8 text-center text-muted-foreground">
            لا توجد طلبات حتى الآن
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>العميل</th>
                  <th>نوع التمويل</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="font-mono text-xs tabular-nums-ar">{request.requestNumber}</td>
                    <td>
                      <div>
                        <p className="font-medium">{request.customer.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums-ar">
                          {request.customer.phone}
                        </p>
                      </div>
                    </td>
                    <td>{typeLabels[request.financingType] || request.financingType}</td>
                    <td className="tabular-nums-ar">{formatCurrency(request.requestedAmount)}</td>
                    <td>
                      <span className={`status-badge status-${request.status}`}>
                        {statusLabels[request.status] || request.status}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(request.createdAt), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </td>
                    <td>
                      <Link to={`/requests/${request.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
