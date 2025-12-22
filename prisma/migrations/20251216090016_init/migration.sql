-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar" TEXT,
    "vendorStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "budget" TEXT,
    "deadline" TIMESTAMP(3),
    "templateId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "demoUrl" TEXT,
    "downloadUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Download" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "vendorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "vendorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorApplication" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentFilePath" TEXT,
    "storeName" TEXT NOT NULL,
    "storeType" TEXT NOT NULL,
    "storeDescription" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "activationCode" CHAR(4),
    "activationCodeExpiresAt" TIMESTAMP(3),
    "activationCodeVerified" BOOLEAN NOT NULL DEFAULT false,
    "userPin" VARCHAR(191),
    "pinSetAt" TIMESTAMP(3),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "blockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProduct" (
    "id" SERIAL NOT NULL,
    "vendorApplicationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "comparePrice" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "trackStock" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "thumbnailUrl" TEXT,
    "downloadUrl" TEXT,
    "downloadFileName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "slug" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorOrder" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "vendorApplicationId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "deliveryMethod" TEXT,
    "downloadedAt" TIMESTAMP(3),
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "customerNote" TEXT,
    "vendorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaShare" (
    "id" SERIAL NOT NULL,
    "articleId" TEXT NOT NULL,
    "articleTitle" TEXT NOT NULL,
    "articleUrl" TEXT NOT NULL,
    "vendorApplicationId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "postId" TEXT,
    "postUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productId_key" ON "Product"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorApplication_userId_key" ON "VendorApplication"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProduct_slug_key" ON "VendorProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VendorOrder_orderNumber_key" ON "VendorOrder"("orderNumber");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorApplication" ADD CONSTRAINT "VendorApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProduct" ADD CONSTRAINT "VendorProduct_vendorApplicationId_fkey" FOREIGN KEY ("vendorApplicationId") REFERENCES "VendorApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorOrder" ADD CONSTRAINT "VendorOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "VendorProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaShare" ADD CONSTRAINT "SocialMediaShare_vendorApplicationId_fkey" FOREIGN KEY ("vendorApplicationId") REFERENCES "VendorApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
