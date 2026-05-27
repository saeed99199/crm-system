import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Contract {
  id: string;
  contractNumber: string;
  amount: number;
  duration: number;
  interestRate?: number;
  monthlyPayment: number | null;
  startDate: string | null;
  endDate: string | null;
}

interface EditContractDialogProps {
  contract: Contract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UpdateContractData {
  amount?: number;
  duration?: number;
  interestRate?: number;
  monthlyPayment?: number;
  startDate?: string;
  endDate?: string;
}

export function EditContractDialog({
  contract,
  open,
  onOpenChange,
}: EditContractDialogProps) {
  const [amount, setAmount] = useState(contract.amount.toString());
  const [duration, setDuration] = useState(contract.duration.toString());
  const [interestRate, setInterestRate] = useState(
    contract.interestRate?.toString() || ""
  );
  const [monthlyPayment, setMonthlyPayment] = useState(
    contract.monthlyPayment?.toString() || ""
  );
  const [startDate, setStartDate] = useState(
    contract.startDate?.split("T")[0] || ""
  );
  const [endDate, setEndDate] = useState(contract.endDate?.split("T")[0] || "");

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: UpdateContractData) =>
      api.put(`/api/contracts/${contract.id}`, data),
    onSuccess: () => {
      toast.success("تم تحديث العقد بنجاح");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث العقد");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !duration) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }

    const data: UpdateContractData = {
      amount: parseFloat(amount),
      duration: parseInt(duration),
    };

    if (interestRate) data.interestRate = parseFloat(interestRate);
    if (monthlyPayment) data.monthlyPayment = parseFloat(monthlyPayment);
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;

    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل العقد {contract.contractNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">المبلغ (ر.س) *</Label>
              <Input
                id="edit-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration">المدة (أشهر) *</Label>
              <Input
                id="edit-duration"
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
              <Label htmlFor="edit-interestRate">نسبة الربح (%)</Label>
              <Input
                id="edit-interestRate"
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-monthlyPayment">القسط الشهري (ر.س)</Label>
              <Input
                id="edit-monthlyPayment"
                type="number"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-startDate">تاريخ البداية</Label>
              <Input
                id="edit-startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endDate">تاريخ النهاية</Label>
              <Input
                id="edit-endDate"
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
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التعديلات"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
