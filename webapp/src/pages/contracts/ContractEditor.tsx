import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Printer, Download, FileCheck, FileX } from "lucide-react";
import html2pdf from "html2pdf.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "attached" | "missing";

interface ContractData {
  contractNumber: string;
  contractDate: string;
  employee: string;
  product: string;
  companyName: string;
  commercialReg: string;
  city: string;
  representative: string;
  nationalId: string;
  mobile: string;
  commission: string;
  financingMin: string;
  financingMax: string;
  durationMin: string;
  durationMax: string;
  rateMin: string;
  rateMax: string;
  guarantees: string;
  adminFees: string;
}

interface DocumentItem {
  label: string;
  status: DocStatus;
}

const defaultDocs: DocumentItem[] = [
  { label: "صورة من الهوية الوطنية", status: "missing" },
  { label: "صورة السجلات التجارية ( الرئيسية والفرعية )", status: "missing" },
  { label: "صورة عقد التأسيس", status: "missing" },
  { label: "بروفايل الشركة", status: "missing" },
  { label: "العنوان الوطني شخصي", status: "missing" },
  { label: "العنوان الوطني للشركة", status: "missing" },
  { label: 'صورة من القوائم المالية لسنتين "مدققة" "ان وجد"', status: "missing" },
  { label: "كشف حساب بنكي شخصي سنتين", status: "missing" },
  { label: 'PDF+Excel "كشف حساب بنكي للشركة لسنتين"', status: "missing" },
  { label: "صورة من الصك", status: "missing" },
  { label: '"صورة رخصة البناء" ان وجد', status: "missing" },
  { label: "صورة من عقود الايجار", status: "missing" },
];

const FINANCING_TYPE_PRODUCT: Record<string, string> = {
  personal: "تمويل شخصي",
  mortgage: "تمويل عقاري",
  car: "تمويل سيارة",
  business: "تمويل أعمال",
  education: "تمويل تعليمي",
  other: "تمويل أخرى",
};

function toGregorian(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return dateStr;
  }
}

// ─── Contract HTML ────────────────────────────────────────────────────────────

const PRINT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Amiri', serif; direction: rtl; color: #1a1a1a; background: #fff; }
  .page { page-break-after: always; padding: 18mm 14mm; max-width: 210mm; margin: 0 auto; }
  .page:last-child { page-break-after: auto; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #999; padding: 5px 8px; font-size: 10px; }
  .footer-line { font-size: 9px; color: #555; text-align: center; margin-top: 10px; border-top: 1px solid #ccc; padding-top: 6px; }
  @media print { @page { size: A4; margin: 0; } body { padding: 0; } }
`;

const FOOTER = `جدة - شارع الأمير محمد بن عبدالعزيز مبنى مساحات الأعمال - الدور الأول ترخيص رقم (968897) | Jeddah - Prince Mohammed bin Abdulaziz Street business spaces building - first floor license no (968897)`;
const LOGO = `https://ssffc.com.sa/wp-content/uploads/2024/12/logo-2.png`;

function headerBlock() {
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
      <div style="text-align:left;">
        <img src="${LOGO}" style="width:55px;height:55px;object-fit:contain;" alt="logo"/>
      </div>
      <div style="text-align:center;flex:1;">
        <div style="font-size:15px;font-weight:bold;">عقد خدمات تسهيل تمويل &amp; استشارات مالية</div>
        <div style="font-size:12px;color:#555;">Contract for Financing Facilitation Services</div>
      </div>
      <div style="text-align:right;font-size:9px;color:#555;min-width:90px;">SMART SOLUTIONS FOR<br/>FINANCIAL CONSULTING</div>
    </div>
    <hr style="border:none;border-top:2px solid #1a3a5c;margin-bottom:10px;"/>`;
}

function para(ar: string, en: string) {
  return `<div style="display:flex;gap:12px;margin-bottom:8px;font-size:11px;line-height:1.8;">
    <div style="flex:1;text-align:justify;">${ar}</div>
    <div style="flex:1;text-align:justify;color:#333;">${en}</div>
  </div>`;
}

function clause(arTitle: string, enTitle: string) {
  return `<div style="display:flex;justify-content:space-between;margin:12px 0 5px;">
    <div style="font-weight:bold;text-decoration:underline;font-size:11px;">${arTitle}</div>
    <div style="font-weight:bold;text-decoration:underline;font-size:11px;">${enTitle}</div>
  </div>`;
}

function buildContractHTML(d: ContractData, docs: DocumentItem[]): string {
  const gr = toGregorian(d.contractDate);
  const blank = (n = 20) => "_".repeat(n);

  // Page 1 – Application form + documents
  const docsRows = docs.map((doc, i) => {
    const ar = doc.status === "attached" ? "مرفق في الملف" : "لا يوجد";
    const bg = doc.status === "attached" ? "#c8e6c9" : "#ffcdd2";
    return `<tr><td style="background:${bg};text-align:center;width:35%;">${ar}</td><td>${i + 1}. ${doc.label}</td></tr>`;
  }).join("");

  const page1 = `<div class="page">
    ${headerBlock()}
    <table style="margin-bottom:10px;">
      <tr><td colspan="2" style="background:#1a3a5c;color:#fff;font-weight:bold;text-align:center;">نموذج طلب &nbsp; Application form</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;width:40%;">رقم العقد:</td><td>${d.contractNumber}</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">التاريخ</td><td>${gr}</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">الموظف</td><td>${d.employee || blank()}<span style="color:red;"> *</span></td></tr>
      <tr><td colspan="2" style="height:6px;border:none;"></td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">المنتج</td><td style="background:#fff9c4;">${d.product}<span style="color:red;"> *</span></td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">مؤسسة / شركة</td><td>${d.companyName || blank()}<span style="font-size:8px;color:#555;"> كتابة الاسم مطابق للسجل التجاري *</span></td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">سجل تجاري رقم</td><td>${d.commercialReg || blank()}<span style="font-size:8px;color:#555;"> من السجل التجاري *</span></td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">وعنوانه  مدينة</td><td>${d.city}</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">ويمثلها في التوقيع</td><td>${d.representative || blank()}<span style="font-size:8px;color:#555;"> اسم العميل مطابق للهوية (رباعي) *</span></td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">هوية رقم /</td><td>${d.nationalId || blank()}</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">جوال /</td><td>${d.mobile || blank()}</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">العمولة</td><td>${d.commission}%</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">التمويل</td><td>من ${d.financingMin} مليون الى ${d.financingMax} مليون</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">المدة</td><td>من ${d.durationMin} - ${d.durationMax} سنوات</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">النسبة</td><td>${d.rateMin}% - ${d.rateMax}%</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">الضمانات</td><td>${d.guarantees}</td></tr>
      <tr><td style="background:#1a3a5c;color:#fff;font-weight:bold;">الرسوم الإدارية</td><td>ر.س. ${d.adminFees}</td></tr>
    </table>
    <table style="margin-bottom:6px;">
      <tr><td colspan="2" style="background:#888;color:#fff;text-align:center;font-weight:bold;">ملاحظات</td></tr>
      <tr><td colspan="2"><span style="color:red;">*</span> سجل ائتماني بدون ملاحظات ( شخصي/الشركة )</td></tr>
      <tr><td colspan="2"><strong>يعتمد على التقييم العقاري CVD والملاءة المالية 50%</strong></td></tr>
      <tr><td colspan="2">نقل الصك باسم العميل</td></tr>
      <tr><td colspan="2">توفير كامل المستندات المطلوبة من الجهة الممولة</td></tr>
    </table>
    <table>
      <tr><td colspan="2" style="background:#888;color:#fff;text-align:center;font-weight:bold;">نموذج المستندات</td></tr>
      ${docsRows}
    </table>
    <div class="footer-line">${FOOTER}</div>
  </div>`;

  // Page 2 – Contract body p1
  const bodyStyle = `font-family:'Amiri',serif;font-size:11px;line-height:1.9;direction:rtl;`;
  const page2 = `<div class="page" style="${bodyStyle}">
    ${headerBlock()}
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:14px;">
      <div><strong>Contract NO:</strong> ${d.contractNumber}</div>
      <div><strong>رقم العقد:</strong> ${d.contractNumber}</div>
    </div>
    ${para(`بعون الله وتوفيقه تم إبرام هذا العقد في مدينة جدة بتاريخ: <strong>${gr}</strong>`, `this contract was concluded in Jeddah on the date <strong>${gr}</strong>`)}
    ${para("بين كل من", "Between")}
    <div style="background:#f0f4ff;border-right:3px solid #1a3a5c;padding:10px;margin-bottom:8px;font-size:11px;">
      <strong>شركة الحلول الذكية للاستشارات المالية</strong> – منشأة سعودية بموجب سجل تجاري رقم (7032447083) مدينة جدة حي الاندلس هاتف (0566787107) ويشار إليها فيما بعد بهذا العقد بـ <strong>"طرف أول"</strong>
      <div style="color:#555;margin-top:4px;">1. <strong>Smart Solutions Financial Consulting Company</strong>, a Saudi entity – under CR No. 7032447083, located in Saudi Arabia Jeddah, Al Andalus District. referred to hereafter as <strong>"First Party"</strong>.</div>
    </div>
    <div style="background:#fff8f0;border-right:3px solid #e67e22;padding:10px;margin-bottom:12px;font-size:11px;">
      <div>مؤسسة / شركة &nbsp; <strong>${d.companyName || blank()}</strong> &nbsp;&nbsp; 2. compani <strong>${d.companyName || blank()}</strong></div>
      <div>سجل تجاري رقم &nbsp; <strong>${d.commercialReg || blank()}</strong> &nbsp;&nbsp; Civil Registration No &nbsp; <strong>${d.commercialReg || blank()}</strong></div>
      <div>وعنوانه المملكة العربية السعودية , مدينة &nbsp; <strong>${d.city}</strong> &nbsp;&nbsp; residing in Ksa &nbsp; <strong>${d.city}</strong></div>
      <div>ويمثلها في التوقيع على هذا العقد السيد / &nbsp; <strong>${d.representative || blank()}</strong> &nbsp;&nbsp; Mr. &nbsp; <strong>${d.representative || blank()}</strong></div>
      <div>هوية رقم / &nbsp; <strong>${d.nationalId || blank()}</strong> &nbsp;&nbsp; National ID &nbsp; <strong>${d.nationalId || blank()}</strong></div>
      <div>جوال / &nbsp; <strong>${d.mobile || blank()}</strong> &nbsp;&nbsp; M \\ &nbsp; <strong>${d.mobile || blank()}</strong></div>
      <div style="margin-top:6px;">ويشار إليه فيما بعد بهذا العقد بـ <strong>"طرف ثاني"</strong> &nbsp;|&nbsp; referred to hereafter as <strong>"Second Party"</strong>.</div>
    </div>
    ${clause("البند الأول: التمهيد", "Preamble Clause :1")}
    ${para("يعتبر التمهيد وأي مراسلات ( نصية أوهاتفية أوالكترونية ) تمهيدية تمت بين الطرفين جزءاً لا يتجزأ من هذا العقد.", "The preamble and any preliminary correspondence (text, telephone or electronic) between the parties form an integral part of this contract.")}
    ${clause("البند الثاني: التزامات الطرف الأول", "First Party's Obligations Clause :2")}
    ${para(".1 يتعهد الطرف الأول بمباشرة البحث والمتابعة لتسهيل حصول الطرف الثاني على حلول تسهيلات ائتمانية أو تمويل من الجهات المعتمدة داخل المملكة العربية السعودية.", "The first party undertakes to conduct research and follow-up to facilitate the second party's access to credit solutions or financing from accredited institutions within the Kingdom of Saudi Arabia.")}
    ${para(".2 التمويل المشار إليه قد يصدر من أكثر من جهة تمويلية، ويحق للطرف الثاني اختيار الجهة المناسبة.", "The financing may be approved by multiple institutions, and the second party has the discretion to select the most suitable option.")}
    ${clause("البند الثالث: الخدمات المقدمة", "Services Provided Clause :3")}
    ${para("يقوم الطرف الأول بتوضيح جميع الشروط والضوابط المطلوبة للحصول على التمويل.", "The first party will inform the second party of all terms and conditions required to secure the financing.")}
    ${para("يتولى إعداد وتجهيز المستندات اللازمة لتسهيل العملية, بعد استلام كامل المستندات من الطرف الثاني.", "The first party will prepare and arrange the necessary documents to facilitate the financing process.")}
    ${para("يتم تقديم المستندات للطرف الأول لرفعها إلى الجهة التمويلية.", "The prepared documents will be submitted by the First party to the relevant financing institution.")}
    ${clause("البند الرابع: مدة العقد", "Contract Duration Clause :4")}
    ${para("تسري أحكام العقد اعتباراً من تاريخ التوقيع عليه ولحين استلام الطرف الثاني للموافقة النهائية من الجهة التمويلية.", "This contract shall remain effective from the date of signing until the second party receives final approval from the financing institution.")}
    <div style="text-align:center;font-size:11px;color:#555;margin-top:10px;">1</div>
    <div class="footer-line">${FOOTER}</div>
  </div>`;

  // Page 3 – Financial obligations
  const page3 = `<div class="page" style="${bodyStyle}">
    ${headerBlock()}
    ${clause("البند الخامس: المستحقات المالية", "Financial Obligations Clause :5")}
    ${para(`.1 يلتزم الطرف الثاني بدفع نسبة <strong>${d.commission}%</strong> من صافي قيمة التمويل المصروف عند نزول المبلغ في حسابه.<br/>مبلغ التمويل : من ${d.financingMin} مليون الى ${d.financingMax} مليون<br/>المدة / بالسنوات : من ${d.durationMin} - ${d.durationMax} سنوات<br/>النسبة : ${d.rateMin}% - ${d.rateMax}%<br/>الضمانات : ${d.guarantees}`,
      `I. The second party is obligated to pay <strong>${d.commission}%</strong> of the net value of the financing disbursed when the amount is reduced to its account.<br/>Amount: ${d.financingMin}M – ${d.financingMax}M<br/>Term / year: ${d.durationMin} – ${d.durationMax} years<br/>Pricing: ${d.rateMin}% – ${d.rateMax}%<br/>guarantees: ${d.guarantees}`)}
    ${para(`.2 الرسوم الإدارية لدراسة الطلب: ر.س. ${d.adminFees} غير مستردة إلا في حالة عدم الموافقة.`, `2. Administrative fees for studying the application: SAR ${d.adminFees} non-refundable unless approved.`)}
    ${para("<strong>يعتمد على التقييم العقاري CVD والملاءة المالية 50%</strong>", "<strong>Depends on CVD and solvency 50% DSR</strong>")}
    <div style="background:#f5f5f5;border:1px solid #ddd;padding:8px 12px;margin:8px 0;font-size:10px;">
      <div style="font-weight:bold;">الشروط والاحكام :</div>
      <div>سجل ائتماني بدون ملاحظات ( شخصي/الشركة )</div>
      <div>يعتمد على التقييم العقاري CVD والملاءة المالية 50%</div>
      <div>نقل الصك باسم العميل</div>
      <div>توفير كامل المستندات المطلوبة من الجهة الممولة</div>
    </div>
    ${para(`.3 تم تحرير سند أمر رقم ${d.contractNumber} لضمان مستحقات الطرف الأول وفقاً للبنود أعلاه.`, `3. An order bond No. ${d.contractNumber} has been issued to guarantee the dues of the first party in accordance with the above items.`)}
    ${para(".4 إذا تم تخفيض مبلغ التمويل، يتم دفع النسبة على المبلغ الموافق عليه.", "4. If the finance amount is reduced, the percentage will be paid on the approved amount.")}
    ${para(".5 في حال صدور الموافقة وعدم استلام الطرف الثاني للتمويل لأسباب شخصية، تبقى العمولة مستحقة للطرف الأول.", "5. In the event that the approval is issued and the second party does not receive the financing for personal reasons, the commission remains due to the first party.")}
    ${para(".6 إذا لم تصدر موافقة تمويلية، يُعتبر العقد منتهياً دون أي التزام مالي.", "6. If no financing approval is issued, the contract shall be deemed terminated without any financial obligation.")}
    ${para(".7 يتم تحويل المستحقات إلى حساب الطرف الأول:<br/><strong>بنك الراجحي</strong><br/>رقم الحساب: 634 6080 1979 8523<br/>آيبان: SA38 8000 0634 6080 1979 8523", "7. Receivables are transferred to the account of the first party:<br/><strong>Bank Al Rajhi</strong><br/>Account Number: 634 6080 1979 8523<br/>IBAN: SA38 8000 0634 6080 1979 8523")}
    ${clause("البند السادس: حدود المسؤولية", "Clause 6: Limitations of Liability")}
    ${para(".1 الطرف الأول غير مسؤول عن أي خسائر أو مشاريع للطرف الثاني بعد استلام التمويل.", "I. The first party is not responsible for any losses or projects undertaken by the second party after receiving the financing.")}
    ${para(".2 يلتزم الطرف الثاني بتقديم وثائق صحيحة وسليمة عند تقديم الطلب.", "II. The second party shall provide accurate documents upon request and ensure their validity.")}
    <div style="text-align:center;font-size:11px;color:#555;margin-top:10px;">2</div>
    <div class="footer-line">${FOOTER}</div>
  </div>`;

  // Page 4 – Remaining clauses + signatures
  const page4 = `<div class="page" style="${bodyStyle}">
    ${headerBlock()}
    ${para(".3 الطرف الأول غير مسؤول عن رفض الجهات التمويلية لأي سبب.", "III. The first party is not liable if the financing institution refuses the financing request for reasons related to their policies or incompatibility with applicable regulations.")}
    <div style="text-align:center;font-size:11px;color:#555;margin:6px 0;">3</div>
    ${clause("البند السابع: ضمان المستحقات", "Clause :7 Guarantee of Entitlements")}
    ${para("إذا أبرم الطرف الثاني اتفاقاً مع الجهة الممولة بناءً على جهود الطرف الأول دون إشراكه، تبقى مستحقات الطرف الأول قائمة", "If the second party concludes an agreement with the financing institution independently but as a result of the first party's efforts, the first party remains entitled to the commission specified in Clause 5.")}
    ${clause("البند الثامن: مدة العقد", "Contract Duration and Renewal Clause :8")}
    ${para("مدة العقد <strong>90 يوم عمل</strong>، ولا يجوز فسخه خلال هذه الفترة. يمكن تجديده باتفاق الطرفين إذا لم يتم الحصول على التمويل المطلوب", "The contract duration is <strong>90 working days</strong>. It cannot be terminated during this period. The contract may be renewed by mutual agreement if the financing is not obtained.")}
    ${clause("البند التاسع: عدم التنازل", "Non-Assignment Clause :9")}
    ${para("لا يجوز لأي من الطرفين التنازل عن هذا العقد لطرف ثالث إلا بموافقة كتابية مسبقة.", "Neither party may assign this contract to a third party without prior written consent from the other party.")}
    ${clause("البند العاشر: الالتزام القانوني", "Binding Nature Clause :10")}
    ${para("يسري هذا العقد على الطرفين وخلفائهما الخاص والعام.", "This contract shall be binding upon both parties and their respective successors.")}
    ${clause("البند الحادي عشر: الاتفاق الكامل", "Entire Agreement Clause :11")}
    ${para("هذا العقد يشمل كافة البنود والشروط المتفق عليها، وأي تعديل يتطلب اتفاقاً مكتوباً بين الطرفين.", "This contract constitutes the entire agreement. No amendments shall be valid unless made in writing and signed by both parties.")}
    ${clause("البند الثاني عشر: السرية", "Clause 12: Confidentiality")}
    ${para("يلتزم الطرفان بالحفاظ على سرية المعلومات والتقارير المتعلقة بالتمويل.", "Both parties agree to keep all information and reports related to the financing process confidential.")}
    ${clause("البند الثالث عشر: حل النزاعات", "Dispute Resolution Clause :13")}
    ${para("تُحل النزاعات ودياً بين الطرفين. وإذا تعذر ذلك، تُحال إلى الجهات القضائية المختصة بمحافظة جدة.", "Any disputes shall be resolved amicably. If not possible, disputes shall be referred to the competent judicial authorities in Jeddah.")}
    ${clause("البند الرابع عشر: الإقرار بالقبول", "Acknowledgment of Acceptance Clause :14")}
    ${para("أقر الطرفان بمراجعة العقد وقبولهما لجميع شروطه وأحكامه.", "Both parties confirm that they have reviewed this contract in its entirety and agree to its terms.")}
    <div style="display:flex;justify-content:space-between;margin-top:24px;padding-top:14px;border-top:1px solid #ccc;font-size:11px;">
      <div style="width:45%;text-align:center;">
        <div style="font-weight:bold;margin-bottom:4px;">الطرف الأول</div>
        <div style="font-weight:bold;">شركة الحلول الذكية للاستشارات المالية</div>
        <div style="margin-top:4px;">التاريخ: ${gr}</div>
        <div style="border:1px solid #999;height:55px;margin-top:8px;"></div>
        <div style="margin-top:4px;color:#555;">التوقيع</div>
      </div>
      <div style="width:45%;text-align:center;">
        <div style="font-weight:bold;margin-bottom:4px;">الطرف الثاني</div>
        <div>شركة / مؤسسة</div>
        <div style="font-weight:bold;">${d.companyName || blank()}</div>
        <div>يمثلها: <strong>${d.representative || blank()}</strong></div>
        <div>التاريخ: ${gr}</div>
        <div style="border:1px solid #999;height:55px;margin-top:8px;"></div>
        <div style="margin-top:4px;color:#555;">التوقيع</div>
      </div>
    </div>
    <div style="text-align:center;font-size:11px;color:#555;margin-top:6px;">4 - 5</div>
    <div class="footer-line">${FOOTER}</div>
  </div>`;

  // Page 5 – سند لأمر
  const page5 = `<div class="page" style="${bodyStyle}">
    <div style="text-align:center;font-size:30px;font-weight:bold;margin:20px 0 30px;letter-spacing:4px;">سـنـــد لأمـــر</div>
    <table style="width:60%;margin:0 auto 16px;">
      <tr><td style="background:#f5f5f5;font-weight:bold;">تاريخ الإصدار:</td><td>${gr}</td></tr>
      <tr><td style="background:#f5f5f5;font-weight:bold;">رقم السند:</td><td>${d.contractNumber}</td></tr>
      <tr><td style="background:#f5f5f5;font-weight:bold;">مكان الإصدار:</td><td>${d.city}</td></tr>
    </table>
    <div style="font-size:12px;text-align:center;margin-bottom:16px;line-height:2.2;">
      نقر نحن الموقعين أدناه شركة / <strong>${d.companyName || blank()}</strong><br/>
      سجل تجاري رقم / <strong>${d.commercialReg || blank()}</strong><br/>
      مدينة / <strong>${d.city}</strong>
    </div>
    <div style="font-size:13px;font-weight:bold;text-align:center;margin-bottom:16px;line-height:2.2;">
      بأن ادفع بموجب السند بدون قيد او شرط لأمر/ <strong>شركة الحلول الذكية للاستشارات المالية</strong> بموجب السجل التجاري رقم (7032447083).
    </div>
    <table style="width:70%;margin:0 auto 16px;">
      <tr><td style="font-weight:bold;">مبلغ /</td><td>______________________ ريال سعودي فقط لا غير</td></tr>
      <tr><td style="font-weight:bold;">كتابة /</td><td>______________________ ريال سعودي فقط لا غير</td></tr>
    </table>
    <div style="font-size:11px;text-align:center;margin-bottom:10px;line-height:2;">
      مبلغ السند واجب الدفع لشركة الحلول الذكية للاستشارات المالية, في حال تم إيداع مبلغ السند أعلاه لدى حساب الشركة لدى مصرف الراجحي يعتبر هذا السند لاغي.<br/>
      <strong>(SA38 8000 0634 6080 1979 8523)</strong>
    </div>
    <div style="font-size:13px;font-weight:bold;text-align:center;margin:16px 0;">والله ولي التوفيق،،</div>
    <div style="display:flex;justify-content:space-between;margin-top:16px;font-size:11px;">
      <div style="width:55%;">
        <div>اسم المدين شركة / مؤسسة : <strong>${d.companyName || blank()}</strong></div>
        <div style="margin-top:4px;">يمثلها : <strong>${d.representative || blank()}</strong></div>
        <div style="margin-top:4px;">التاريخ: ${gr}</div>
      </div>
      <div style="width:40%;text-align:center;">
        <div style="font-weight:bold;">التوقيع:</div>
        <div style="border:1px solid #999;height:70px;margin-top:6px;"></div>
      </div>
    </div>
    <div class="footer-line">${FOOTER}</div>
  </div>`;

  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/>
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet"/>
    <style>${PRINT_STYLE}</style>
  </head><body>${page2}${page3}${page4}${page5}</body></html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContractEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill from query params (when navigating from ContractDetailPage)
  const fromParams = (key: string, fallback = "") => searchParams.get(key) ?? fallback;

  const amountRaw = fromParams("amount");
  const amountM = amountRaw ? (Number(amountRaw) / 1_000_000).toFixed(0) : "8";

  const [data, setData] = useState<ContractData>({
    contractNumber: fromParams("contractNumber", "1015"),
    contractDate: new Date().toISOString().split("T")[0],
    employee: "",
    product: FINANCING_TYPE_PRODUCT[fromParams("financingType")] ?? "تمويل أعمال",
    companyName: fromParams("companyName"),
    commercialReg: fromParams("commercialReg"),
    city: "جدة",
    representative: "",
    nationalId: fromParams("nationalId"),
    mobile: fromParams("mobile"),
    commission: "4",
    financingMin: amountM,
    financingMax: "15",
    durationMin: fromParams("duration") || "2",
    durationMax: "10",
    rateMin: "8",
    rateMax: "14",
    guarantees: "رهن أو افراغ / ضمانات الشركة + ضمانات الشركاء",
    adminFees: "20,000",
  });

  const [docs, setDocs] = useState<DocumentItem[]>(defaultDocs);

  const set = (field: keyof ContractData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((p) => ({ ...p, [field]: e.target.value }));

  const toggleDoc = (i: number) =>
    setDocs((prev) =>
      prev.map((d, idx) =>
        idx === i ? { ...d, status: d.status === "attached" ? "missing" : "attached" } : d
      )
    );

  const getHTML = () => buildContractHTML(data, docs);

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(getHTML());
    w.document.close();
    setTimeout(() => w.print(), 800);
  };

  const handleExportPDF = async () => {
    const container = document.createElement("div");
    container.innerHTML = getHTML();
    const body = container.querySelector("body");
    if (!body) return;
    const opt = {
      margin: 0,
      filename: `عقد_تمويل_${data.contractNumber}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    };
    try {
      await html2pdf().set(opt).from(body).save();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/contracts")}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">محرر عقد تسهيل التمويل</h1>
              <p className="text-xs text-muted-foreground">عقد رقم {data.contractNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">طباعة</span>
            </Button>
            <Button onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">تصدير PDF</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm text-primary">بيانات العقد</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>رقم العقد</Label><Input value={data.contractNumber} onChange={set("contractNumber")} /></div>
                <div className="space-y-1"><Label>التاريخ</Label><Input type="date" value={data.contractDate} onChange={set("contractDate")} /></div>
                <div className="space-y-1"><Label>الموظف</Label><Input value={data.employee} onChange={set("employee")} placeholder="اسم الموظف" /></div>
                <div className="space-y-1"><Label>المنتج</Label><Input value={data.product} onChange={set("product")} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm text-primary">بيانات الطرف الثاني (العميل)</h3>
              <div className="space-y-1"><Label>اسم المؤسسة / الشركة</Label><Input value={data.companyName} onChange={set("companyName")} placeholder="مطابق للسجل التجاري" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>رقم السجل التجاري</Label><Input value={data.commercialReg} onChange={set("commercialReg")} /></div>
                <div className="space-y-1"><Label>المدينة</Label><Input value={data.city} onChange={set("city")} /></div>
              </div>
              <div className="space-y-1"><Label>الممثل في التوقيع (رباعي)</Label><Input value={data.representative} onChange={set("representative")} placeholder="الاسم الرباعي" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>رقم الهوية</Label><Input value={data.nationalId} onChange={set("nationalId")} /></div>
                <div className="space-y-1"><Label>الجوال</Label><Input value={data.mobile} onChange={set("mobile")} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm text-primary">الشروط المالية</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>العمولة %</Label><Input value={data.commission} onChange={set("commission")} /></div>
                <div className="space-y-1"><Label>الرسوم الإدارية (ر.س)</Label><Input value={data.adminFees} onChange={set("adminFees")} /></div>
                <div className="space-y-1"><Label>التمويل من (مليون)</Label><Input value={data.financingMin} onChange={set("financingMin")} /></div>
                <div className="space-y-1"><Label>التمويل إلى (مليون)</Label><Input value={data.financingMax} onChange={set("financingMax")} /></div>
                <div className="space-y-1"><Label>المدة من (سنوات)</Label><Input value={data.durationMin} onChange={set("durationMin")} /></div>
                <div className="space-y-1"><Label>المدة إلى (سنوات)</Label><Input value={data.durationMax} onChange={set("durationMax")} /></div>
                <div className="space-y-1"><Label>النسبة من %</Label><Input value={data.rateMin} onChange={set("rateMin")} /></div>
                <div className="space-y-1"><Label>النسبة إلى %</Label><Input value={data.rateMax} onChange={set("rateMax")} /></div>
              </div>
              <div className="space-y-1"><Label>الضمانات</Label><Input value={data.guarantees} onChange={set("guarantees")} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-sm text-primary">نموذج المستندات</h3>
              {docs.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleDoc(i)}
                >
                  <span className="text-sm flex-1">{i + 1}. {doc.label}</span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 gap-1 text-xs ${doc.status === "attached" ? "bg-green-50 text-green-700 border-green-300" : "bg-red-50 text-red-600 border-red-300"}`}
                  >
                    {doc.status === "attached" ? <FileCheck className="h-3 w-3" /> : <FileX className="h-3 w-3" />}
                    {doc.status === "attached" ? "مرفق في الملف" : "لا يوجد"}
                  </Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">اضغط على أي مستند لتغيير حالته</p>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">معاينة العقد</h3>
              <span className="text-xs text-muted-foreground">6 صفحات</span>
            </div>
            <div className="bg-white overflow-auto max-h-[calc(100vh-200px)]">
              <iframe
                key={JSON.stringify({ data, docs })}
                srcDoc={getHTML()}
                className="w-full border-0"
                style={{ height: "720px" }}
                title="preview"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
