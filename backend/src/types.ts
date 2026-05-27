import { z } from "zod";

// Customer Types
export const CustomerTypeEnum = z.enum(["individual", "company"]);
export type CustomerType = z.infer<typeof CustomerTypeEnum>;

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  nationalId: z.string().nullable(),
  commercialReg: z.string().nullable(),
  phone: z.string(),
  email: z.string().nullable(),
  type: CustomerTypeEnum,
  address: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, "اسم العميل مطلوب"),
  nationalId: z.string().optional(),
  commercialReg: z.string().optional(),
  phone: z.string().min(1, "رقم الجوال مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  type: CustomerTypeEnum,
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;

// Financing Request Types
export const FinancingTypeEnum = z.enum(["personal", "mortgage", "car", "business", "education", "other"]);
export type FinancingType = z.infer<typeof FinancingTypeEnum>;

export const RequestStatusEnum = z.enum([
  "new",
  "under_review",
  "documents_required",
  "approved",
  "rejected",
  "completed",
]);
export type RequestStatus = z.infer<typeof RequestStatusEnum>;

export const FinancingRequestSchema = z.object({
  id: z.string(),
  requestNumber: z.string(),
  customerId: z.string(),
  financingType: FinancingTypeEnum,
  requestedAmount: z.number(),
  approvedAmount: z.number().nullable(),
  financingEntity: z.string().nullable(),
  status: RequestStatusEnum,
  submissionDate: z.coerce.date(),
  lastUpdateDate: z.coerce.date(),
  approvalDate: z.coerce.date().nullable(),
  completionDate: z.coerce.date().nullable(),
  assignedEmployeeId: z.string().nullable(),
  internalNotes: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type FinancingRequest = z.infer<typeof FinancingRequestSchema>;

export const CreateFinancingRequestSchema = z.object({
  customerId: z.string().min(1, "العميل مطلوب"),
  financingType: FinancingTypeEnum,
  requestedAmount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  financingEntity: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type CreateFinancingRequest = z.infer<typeof CreateFinancingRequestSchema>;

export const UpdateRequestStatusSchema = z.object({
  status: RequestStatusEnum,
  approvedAmount: z.number().optional(),
  rejectionReason: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type UpdateRequestStatus = z.infer<typeof UpdateRequestStatusSchema>;

// Contract Types
export const ContractStatusEnum = z.enum(["draft", "pending_signature", "signed", "active", "completed"]);
export type ContractStatus = z.infer<typeof ContractStatusEnum>;

export const ContractSchema = z.object({
  id: z.string(),
  contractNumber: z.string(),
  customerId: z.string(),
  requestId: z.string(),
  amount: z.number(),
  interestRate: z.number().nullable(),
  duration: z.number(),
  monthlyPayment: z.number().nullable(),
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  fileUrl: z.string().nullable(),
  signedAt: z.coerce.date().nullable(),
  status: ContractStatusEnum,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Contract = z.infer<typeof ContractSchema>;

export const CreateContractSchema = z.object({
  requestId: z.string().min(1, "الطلب مطلوب"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  interestRate: z.number().optional(),
  duration: z.number().positive("المدة يجب أن تكون أكبر من صفر"),
  monthlyPayment: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateContract = z.infer<typeof CreateContractSchema>;

// Employee/User Types
export const UserRoleEnum = z.enum(["admin", "manager", "employee", "viewer"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: UserRoleEnum,
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

// Activity Log Types
export const ActivityLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  description: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  userId: z.string().nullable(),
  requestId: z.string().nullable(),
  metadata: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type ActivityLog = z.infer<typeof ActivityLogSchema>;

// Dashboard Stats Types
export const DashboardStatsSchema = z.object({
  totalRequests: z.number(),
  newRequests: z.number(),
  underReview: z.number(),
  approved: z.number(),
  rejected: z.number(),
  completed: z.number(),
  totalFinancingValue: z.number(),
  totalCustomers: z.number(),
  totalContracts: z.number(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// Financing Entity Types
export const FinancingEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["bank", "finance_company", "government"]),
  logo: z.string().nullable(),
  contactInfo: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type FinancingEntity = z.infer<typeof FinancingEntitySchema>;

// Document Types
export const DocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  fileUrl: z.string(),
  fileSize: z.number().nullable(),
  requestId: z.string(),
  uploadedAt: z.coerce.date(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const CreateDocumentSchema = z.object({
  name: z.string().min(1, "اسم المستند مطلوب"),
  type: z.string().min(1, "نوع المستند مطلوب"),
  fileUrl: z.string().url("رابط الملف غير صالح"),
  fileSize: z.number().optional(),
  requestId: z.string().min(1, "الطلب مطلوب"),
});

export type CreateDocument = z.infer<typeof CreateDocumentSchema>;

// API Response Types
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
  });

export const ApiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
