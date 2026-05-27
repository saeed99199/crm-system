import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeleteContractDialogProps {
  contractId: string;
  contractNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteContractDialog({
  contractId,
  contractNumber,
  open,
  onOpenChange,
}: DeleteContractDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/contracts/${contractId}`),
    onSuccess: () => {
      toast.success("تم حذف العقد بنجاح");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "حدث خطأ أثناء حذف العقد");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من حذف العقد رقم {contractNumber}؟ لا يمكن التراجع عن
            هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري الحذف...
              </>
            ) : (
              "حذف العقد"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
