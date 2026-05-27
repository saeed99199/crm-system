import { useState, useMemo } from "react";
import { Calculator, TrendingUp, Wallet, PiggyBank, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 2,
  }).format(num);
};

export function CalculatorPage() {
  const [financingAmount, setFinancingAmount] = useState<string>("500000");
  const [durationYears, setDurationYears] = useState<string>("15");
  const [annualProfitRate, setAnnualProfitRate] = useState<string>("5");

  const calculations = useMemo(() => {
    const principal = parseFloat(financingAmount) || 0;
    const years = parseInt(durationYears) || 1;
    const annualRate = parseFloat(annualProfitRate) || 0;

    if (principal <= 0 || years <= 0 || annualRate <= 0) {
      return {
        monthlyPayment: 0,
        totalAmount: 0,
        totalProfit: 0,
        amortizationTable: [] as AmortizationRow[],
      };
    }

    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;

    // Monthly Payment = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    const powFactor = Math.pow(1 + monthlyRate, totalMonths);
    const monthlyPayment = principal * (monthlyRate * powFactor) / (powFactor - 1);

    const totalAmount = monthlyPayment * totalMonths;
    const totalProfit = totalAmount - principal;

    // Generate amortization table
    const amortizationTable: AmortizationRow[] = [];
    let balance = principal;

    for (let month = 1; month <= totalMonths; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance = Math.max(0, balance - principalPayment);

      amortizationTable.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: balance,
      });
    }

    return {
      monthlyPayment,
      totalAmount,
      totalProfit,
      amortizationTable,
    };
  }, [financingAmount, durationYears, annualProfitRate]);

  const yearOptions = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20">
          <Calculator className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">حاسبة التمويل</h1>
          <p className="text-muted-foreground text-sm mt-1">
            احسب القسط الشهري وجدول السداد للتمويل
          </p>
        </div>
      </div>

      {/* Input Section */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            معلومات التمويل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Financing Amount */}
            <div className="space-y-2">
              <Label htmlFor="financing-amount" className="text-sm font-medium">
                مبلغ التمويل (ريال)
              </Label>
              <Input
                id="financing-amount"
                type="number"
                value={financingAmount}
                onChange={(e) => setFinancingAmount(e.target.value)}
                placeholder="أدخل مبلغ التمويل"
                className="text-right tabular-nums-ar"
                min="0"
              />
            </div>

            {/* Duration in Years */}
            <div className="space-y-2">
              <Label htmlFor="duration-years" className="text-sm font-medium">
                مدة التمويل بالسنوات
              </Label>
              <Select value={durationYears} onValueChange={setDurationYears}>
                <SelectTrigger id="duration-years" className="text-right">
                  <SelectValue placeholder="اختر المدة" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year} {year === 1 ? "سنة" : year === 2 ? "سنتان" : year <= 10 ? "سنوات" : "سنة"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Annual Profit Rate */}
            <div className="space-y-2">
              <Label htmlFor="profit-rate" className="text-sm font-medium">
                نسبة الربح السنوية %
              </Label>
              <Input
                id="profit-rate"
                type="number"
                value={annualProfitRate}
                onChange={(e) => setAnnualProfitRate(e.target.value)}
                placeholder="أدخل نسبة الربح"
                className="text-right tabular-nums-ar"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Payment */}
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">القسط الشهري</p>
                <p className="text-2xl font-bold text-foreground tabular-nums-ar">
                  {formatCurrency(calculations.monthlyPayment)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Amount */}
        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <PiggyBank className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبلغ المدفوع</p>
                <p className="text-2xl font-bold text-foreground tabular-nums-ar">
                  {formatCurrency(calculations.totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Profit */}
        <Card className="border-border/50 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <TrendingUp className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-foreground tabular-nums-ar">
                  {formatCurrency(calculations.totalProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Amortization Table */}
      {calculations.amortizationTable.length > 0 && (
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              جدول السداد التفصيلي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-lg border border-border/50">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="text-right font-semibold">الشهر</TableHead>
                    <TableHead className="text-right font-semibold">القسط</TableHead>
                    <TableHead className="text-right font-semibold">الأصل</TableHead>
                    <TableHead className="text-right font-semibold">الربح</TableHead>
                    <TableHead className="text-right font-semibold">المتبقي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.amortizationTable.map((row) => (
                    <TableRow
                      key={row.month}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium tabular-nums-ar">
                        {formatNumber(row.month)}
                      </TableCell>
                      <TableCell className="tabular-nums-ar text-primary">
                        {formatCurrency(row.payment)}
                      </TableCell>
                      <TableCell className="tabular-nums-ar text-emerald-500">
                        {formatCurrency(row.principal)}
                      </TableCell>
                      <TableCell className="tabular-nums-ar text-amber-500">
                        {formatCurrency(row.interest)}
                      </TableCell>
                      <TableCell className="tabular-nums-ar font-medium">
                        {formatCurrency(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              * جميع المبالغ بالريال السعودي - الحسابات تقريبية وقد تختلف عن العقد الفعلي
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
