import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface StatusChangeDropdownProps {
  contractId: string;
  currentStatus: string;
}

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending_signature: "بانتظار التوقيع",
  signed: "موقع",
  active: "نشط",
  completed: "مكتمل",
};

const statusOptions = [
  { value: "draft", label: "مسودة" },
  { value: "pending_signature", label: "بانتظار التوقيع" },
  { value: "signed", label: "موقع" },
  { value: "active", label: "نشط" },
  { value: "completed", label: "مكتمل" },
];

export function StatusChangeDropdown({
  contractId,
  currentStatus,
}: StatusChangeDropdownProps) {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      api.patch(`/api/contracts/${contractId}/status`, { status: newStatus }),
    onSuccess: () => {
      toast.success("تم تحديث حالة العقد");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء تحديث الحالة");
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== currentStatus) {
      statusMutation.mutate(newStatus);
    }
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={statusMutation.isPending}
    >
      <SelectTrigger className="w-[140px] h-8 text-xs">
        {statusMutation.isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>جاري...</span>
          </div>
        ) : (
          <SelectValue>
            {statusLabels[currentStatus] || currentStatus}
          </SelectValue>
        )}
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
