import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ApprovedRequest {
  id: string;
  requestNumber: string;
  financingType: string;
  amount: number;
  customer: {
    id: string;
    name: string;
  };
}

interface CreateContractData {
  requestId: string;
  amount: number;
  duration: number;
  interestRate?: number;
  monthlyPayment?: number;
  startDate?: string;
  endDate?: string;
}

export function CreateContractDialog() {
  const [open, setOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const queryClient = useQueryClient();

  const { data: approvedRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ["requests", { status: "approved" }],
    queryFn: () => api.get<ApprovedRequest[]>("/api/requests?status=approved"),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateContractData) =>
      api.post("/api/contracts", data),
    onSuccess: () => {
      toast.success("تم إنشاء العقد بنجاح");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      resetForm();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء العقد");
    },
  });

  const resetForm = () => {
    setSelectedRequestId("");
    setAmount("");
    setDuration("");
    setInterestRate("");
    setMonthlyPayment("");
    setStartDate("");
    setEndDate("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRequestId || !amount || !duration) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    const data: CreateContractData = {
      requestId: selectedRequestId,
      amount: parseFloat(amount),
      duration: parseInt(duration),
    };

    if (interestRate) data.interestRate = parseFloat(interestRate);
    if (monthlyPayment) data.monthlyPayment = parseFloat(monthlyPayment);
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;

    createMutation.mutate(data);
  };

  const selectedRequest = approvedRequests?.find(
    (r) => r.id === selectedRequestId
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          عقد جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء عقد جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="request">طلب التمويل *</Label>
            {loadingRequests ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={selectedRequestId}
                onValueChange={(value) => {
                  setSelectedRequestId(value);
                  const request = approvedRequests?.find((r) => r.id === value);
                  if (request) {
                    setAmount(request.amount.toString());
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر طلب التمويل" />
                </SelectTrigger>
                <SelectContent>
                  {approvedRequests?.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      لا توجد طلبات موافق عليها
                    </div>
                  ) : (
                    approvedRequests?.map((request) => (
                      <SelectItem key={request.id} value={request.id}>
                        {request.requestNumber} - {request.customer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {selectedRequest && (
              <p className="text-xs text-muted-foreground">
                نوع التمويل: {selectedRequest.financingType}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (ر.س) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">المدة (أشهر) *</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="12"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interestRate">نسبة الربح (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyPayment">القسط الشهري (ر.س)</Label>
              <Input
                id="monthlyPayment"
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">تاريخ البداية</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">تاريخ النهاية</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء العقد"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
