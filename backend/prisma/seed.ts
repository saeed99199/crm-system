import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.financingRequest.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.financingEntity.deleteMany();

  // Create financing entities
  const entities = await Promise.all([
    prisma.financingEntity.create({
      data: { name: "البنك الأهلي السعودي", type: "bank", isActive: true },
    }),
    prisma.financingEntity.create({
      data: { name: "بنك الراجحي", type: "bank", isActive: true },
    }),
    prisma.financingEntity.create({
      data: { name: "بنك الرياض", type: "bank", isActive: true },
    }),
    prisma.financingEntity.create({
      data: { name: "شركة عبداللطيف جميل للتمويل", type: "finance_company", isActive: true },
    }),
    prisma.financingEntity.create({
      data: { name: "شركة تسهيل للتمويل", type: "finance_company", isActive: true },
    }),
    prisma.financingEntity.create({
      data: { name: "صندوق التنمية العقارية", type: "government", isActive: true },
    }),
    prisma.financingEntity.create({
      data: { name: "بنك التنمية الاجتماعية", type: "government", isActive: true },
    }),
  ]);

  console.log(`✅ Created ${entities.length} financing entities`);

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "أحمد محمد العتيبي",
        nationalId: "1089234567",
        phone: "0501234567",
        email: "ahmed@email.com",
        type: "individual",
        address: "الرياض - حي النخيل",
      },
    }),
    prisma.customer.create({
      data: {
        name: "خالد عبدالله السعيد",
        nationalId: "1092345678",
        phone: "0559876543",
        email: "khaled@email.com",
        type: "individual",
        address: "جدة - حي الروضة",
      },
    }),
    prisma.customer.create({
      data: {
        name: "شركة الأفق للمقاولات",
        commercialReg: "1010123456",
        phone: "0112345678",
        email: "info@alafaq.com.sa",
        type: "company",
        address: "الرياض - حي العليا",
      },
    }),
    prisma.customer.create({
      data: {
        name: "فهد سعد الدوسري",
        nationalId: "1078234567",
        phone: "0543216789",
        type: "individual",
        address: "الدمام - حي الفيصلية",
      },
    }),
    prisma.customer.create({
      data: {
        name: "مؤسسة النجاح التجارية",
        commercialReg: "4030567890",
        phone: "0126789012",
        email: "contact@najah.com.sa",
        type: "company",
        address: "جدة - حي السليمانية",
      },
    }),
    prisma.customer.create({
      data: {
        name: "سارة أحمد الغامدي",
        nationalId: "1095678901",
        phone: "0567890123",
        email: "sara@email.com",
        type: "individual",
        address: "مكة المكرمة - حي العزيزية",
      },
    }),
    prisma.customer.create({
      data: {
        name: "محمد علي الشهري",
        nationalId: "1083456789",
        phone: "0534567890",
        type: "individual",
        address: "أبها - حي المنسك",
      },
    }),
    prisma.customer.create({
      data: {
        name: "شركة الريادة للتقنية",
        commercialReg: "1010789012",
        phone: "0114567890",
        email: "hello@riyada.tech",
        type: "company",
        address: "الرياض - حي الصحافة",
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // Create financing requests
  const requests = await Promise.all([
    prisma.financingRequest.create({
      data: {
        requestNumber: "REQ-202501-0001",
        customerId: customers[0].id,
        financingType: "personal",
        requestedAmount: 150000,
        financingEntity: "البنك الأهلي السعودي",
        status: "new",
        internalNotes: "عميل جديد - يحتاج مراجعة سريعة",
      },
    }),
    prisma.financingRequest.create({
      data: {
        requestNumber: "REQ-202501-0002",
        customerId: customers[1].id,
        financingType: "mortgage",
        requestedAmount: 850000,
        financingEntity: "صندوق التنمية العقارية",
        status: "under_review",
        internalNotes: "في انتظار تقرير سمة",
      },
    }),
    prisma.financingRequest.create({
      data: {
        requestNumber: "REQ-202501-0003",
        customerId: customers[2].id,
        financingType: "business",
        requestedAmount: 500000,
        financingEntity: "بنك الراجحي",
        status: "documents_required",
        internalNotes: "مطلوب القوائم المالية للسنتين الأخيرتين",
      },
    }),
    prisma.financingRequest.create({
      data: {
        requestNumber: "REQ-202501-0004",
        customerId: customers[3].id,
        financingType: "car",
        requestedAmount: 120000,
        financingEntity: "شركة عبداللطيف جميل للتمويل",
        status: "approved",
        approvedAmount: 110000,
        approvalDate: new Date(),
        internalNotes: "تمت الموافقة - في انتظار توقيع العقد",
      },
    }),
    prisma.financingRequest.create({
      data: {
        requestNumber: "REQ-202501-0005",
        customerId: customers[4].id,
        financingType: "business",
        requestedAmount: 1000000,
        financingEntity: "بنك الرياض",
        status: "completed",
        approvedAmount: 950000,
        approvalDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completionDate: new Date(),
      },
    }),
    prisma.financingRequest.create({
      data: {
        requestNumber: "REQ-202501-0006",
        customerId: customers[5].id,
        financingType: "personal",
        requestedAmount: 80000,
        financingEntity: "بنك التنمية الاجتماعية",
        status: "rejected",
        rejectionReason: "عدم استيفاء الحد الأدنى للراتب",
      },
    }),
    prisma.financingRequest.create({
      data: {
        requestNumber: "REQ-202501-0007",
        customerId: customers[6].id,
        financingType: "education",
        requestedAmount: 60000,
        financingEntity: "بنك التنمية الاجتماعية",
        status: "new",
      },
    }),
    prisma.financingRequest.create({
      data: {
        requestNumber: "REQ-202501-0008",
        customerId: customers[7].id,
        financingType: "business",
        requestedAmount: 750000,
        financingEntity: "البنك الأهلي السعودي",
        status: "under_review",
        internalNotes: "شركة ناشئة واعدة",
      },
    }),
  ]);

  console.log(`✅ Created ${requests.length} financing requests`);

  // Create a contract for the completed request
  const contract = await prisma.contract.create({
    data: {
      contractNumber: "CON-2025-0001",
      customerId: customers[4].id,
      requestId: requests[4].id,
      amount: 950000,
      interestRate: 4.5,
      duration: 60,
      monthlyPayment: 17708,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 30 * 24 * 60 * 60 * 1000),
      status: "active",
      signedAt: new Date(),
    },
  });

  console.log(`✅ Created 1 contract`);

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        action: "created",
        description: "تم إنشاء طلب تمويل جديد برقم REQ-202501-0001",
        entityType: "request",
        entityId: requests[0].id,
        requestId: requests[0].id,
      },
      {
        action: "status_changed",
        description: 'تم تغيير حالة الطلب إلى "قيد المراجعة"',
        entityType: "request",
        entityId: requests[1].id,
        requestId: requests[1].id,
      },
      {
        action: "contract_created",
        description: "تم إنشاء عقد جديد برقم CON-2025-0001",
        entityType: "contract",
        entityId: contract.id,
        requestId: requests[4].id,
      },
    ],
  });

  console.log(`✅ Created activity logs`);

  console.log("🎉 Seed completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
