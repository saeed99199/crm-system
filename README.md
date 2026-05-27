# نظام CRM - الحلول الذكية للاستشارات المالية

نظام إدارة علاقات العملاء (CRM) متكامل لشركة وساطة مالية تعمل في المملكة العربية السعودية.

## الميزات الرئيسية

### 1. لوحة التحكم (Dashboard)
- إحصائيات فورية للطلبات والعملاء والعقود
- رسوم بيانية لتوزيع الطلبات حسب الحالة والنوع
- عرض أحدث الطلبات
- قيمة التمويلات الإجمالية

### 2. إدارة العملاء
- إضافة وتعديل وحذف العملاء
- دعم نوعين: أفراد وشركات
- بيانات الهوية/السجل التجاري
- معلومات التواصل (جوال، بريد إلكتروني)
- ربط العميل بطلباته
- **صفحة تفاصيل العميل**
- **رفع مستندات العميل** (صورة الهوية، السجل التجاري، شهادة الراتب، كشف حساب، أخرى)

### 3. طلبات التمويل
- إنشاء طلب تمويل جديد
- **تعديل وحذف الطلبات**
- تتبع حالة الطلب (جديد، قيد المراجعة، مطلوب مستندات، موافق عليه، مرفوض، مكتمل)
- **صفحة تفاصيل الطلب**
- أنواع التمويل: شخصي، عقاري، سيارات، تجاري، تعليمي
- ربط بجهات التمويل
- ملاحظات داخلية

### 4. إدارة العقود
- **إنشاء وتعديل وحذف العقود**
- إنشاء عقود من الطلبات الموافق عليها
- **صفحة تفاصيل العقد**
- تتبع حالة العقد (مسودة، بانتظار التوقيع، موقع، نشط، مكتمل)
- معلومات المبلغ والمدة والقسط الشهري

### 5. إدارة الموظفين
- **إضافة وتعديل وحذف الموظفين**
- عرض قائمة الموظفين
- تعديل الصلاحيات (مدير، مشرف، موظف، مشاهد)
- عدد الطلبات المسندة لكل موظف
- **مستخدم إداري جاهز**: admin@crm.com

### 6. جهات التمويل
- إدارة البنوك وشركات التمويل
- أنواع: بنك، شركة تمويل، جهة حكومية
- تفعيل/إيقاف الجهات

### 7. حاسبة التمويل
- حساب القسط الشهري
- حساب إجمالي المبلغ المدفوع
- حساب إجمالي الأرباح
- جدول تفصيلي للأقساط الشهرية (الأصل، الربح، المتبقي)

### 8. عقد الوساطة التمويلية
- إنشاء عقد وساطة تمويلية قابل للتعديل
- معاينة فورية للعقد
- تصدير إلى PDF
- طباعة العقد

### 9. نظام المصادقة
- تسجيل دخول بالبريد الإلكتروني وكلمة المرور
- تسجيل خروج
- حماية الصفحات للمستخدمين المسجلين فقط
- **بيانات الدخول الافتراضية**: admin@crm.com / admin123

## البنية التقنية

### Frontend (webapp/)
- React + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- React Query للـ Data Fetching
- React Router للتنقل
- Recharts للرسوم البيانية
- تصميم RTL عربي

### Backend (backend/)
- Hono (Bun Runtime)
- Prisma ORM
- SQLite Database
- Better Auth للمصادقة
- Zod للتحقق من البيانات

## الـ API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - إحصائيات لوحة التحكم
- `GET /api/dashboard/charts/status` - بيانات الرسم البياني للحالات
- `GET /api/dashboard/charts/types` - بيانات الرسم البياني للأنواع
- `GET /api/dashboard/recent-requests` - أحدث الطلبات

### Customers
- `GET /api/customers` - قائمة العملاء
- `GET /api/customers/:id` - تفاصيل عميل
- `POST /api/customers` - إضافة عميل
- `PUT /api/customers/:id` - تعديل عميل
- `DELETE /api/customers/:id` - حذف عميل

### Requests
- `GET /api/requests` - قائمة الطلبات
- `GET /api/requests/:id` - تفاصيل طلب
- `POST /api/requests` - إنشاء طلب
- `PUT /api/requests/:id` - تعديل طلب
- `PATCH /api/requests/:id/status` - تحديث حالة الطلب
- `DELETE /api/requests/:id` - حذف طلب

### Contracts
- `GET /api/contracts` - قائمة العقود
- `GET /api/contracts/:id` - تفاصيل عقد
- `POST /api/contracts` - إنشاء عقد
- `PUT /api/contracts/:id` - تعديل عقد
- `PATCH /api/contracts/:id/status` - تحديث حالة العقد
- `DELETE /api/contracts/:id` - حذف عقد

### Employees
- `GET /api/employees` - قائمة الموظفين
- `GET /api/employees/:id` - تفاصيل موظف
- `POST /api/employees` - إضافة موظف
- `PUT /api/employees/:id` - تعديل موظف
- `PATCH /api/employees/:id/role` - تحديث صلاحيات موظف
- `DELETE /api/employees/:id` - حذف موظف

### Customer Documents
- `GET /api/customer-documents/customer/:id` - مستندات عميل
- `POST /api/customer-documents` - رفع مستند
- `DELETE /api/customer-documents/:id` - حذف مستند

### File Upload
- `POST /api/upload` - رفع ملف

### Entities
- `GET /api/entities` - قائمة جهات التمويل
- `POST /api/entities` - إضافة جهة
- `PUT /api/entities/:id` - تعديل جهة
- `PATCH /api/entities/:id/toggle` - تفعيل/إيقاف جهة
- `DELETE /api/entities/:id` - حذف جهة

## التشغيل

الخوادم تعمل تلقائياً:
- Frontend: http://localhost:8000
- Backend: http://localhost:3000

## قاعدة البيانات

لإعادة تهيئة البيانات التجريبية:
```bash
cd backend
bun run prisma/seed.ts
```
