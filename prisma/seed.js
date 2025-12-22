import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lumynis.com' },
    update: {},
    create: {
      email: 'admin@lumynis.com',
      name: 'Admin LUMYNIS',
      password: await bcryptjs.hash('admin123456', 10),
      role: 'admin',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      password: await bcryptjs.hash('password123', 10),
      role: 'admin',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: await bcryptjs.hash('password456', 10),
      role: 'user',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'antben851@gmail.com' },
    update: {},
    create: {
      email: 'antben851@gmail.com',
      name: 'KUNKEL EMMANUEL',
      password: await bcryptjs.hash('password789', 10),
      role: 'seller',
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: 'designer@example.com' },
    update: {},
    create: {
      email: 'designer@example.com',
      name: 'Design Master',
      password: await bcryptjs.hash('design123', 10),
      role: 'designer',
    },
  });

  console.log('Users created:', adminUser.email, user1.email, user2.email, user3.email, user4.email);

  // Create vendor applications
  const vendor1 = await prisma.vendorApplication.create({
    data: {
      userId: user3.id,
      firstName: 'KUNKEL',
      lastName: 'EMMANUEL',
      email: 'antben851@gmail.com',
      phone: '1234567890',
      documentType: 'passeport',
      documentNumber: 'AB123456',
      documentFilePath: '/uploads/documents/passport.pdf',
      storeName: 'DARK NET',
      storeType: 'boutique',
      storeDescription: 'Professional web and graphic design services',
      status: 'approved',
      activationCodeVerified: true,
      userPin: '1234',
    },
  });

  console.log('Vendor created:', vendor1.storeName);

  // Create vendor products
  const product1 = await prisma.vendorProduct.create({
    data: {
      vendorApplicationId: vendor1.id,
      title: 'Web Design Service',
      description: 'Professional web design services for your business',
      category: 'web-design',
      price: 500,
      images: JSON.stringify(['/uploads/products/web-design.jpg']),
      thumbnailUrl: '/uploads/products/web-design.jpg',
      slug: 'web-design-service',
      status: 'published',
      views: 45,
      sales: 12,
    },
  });

  const product2 = await prisma.vendorProduct.create({
    data: {
      vendorApplicationId: vendor1.id,
      title: 'Logo Design',
      description: 'Custom logo design for your brand',
      category: 'graphic-design',
      price: 150,
      images: JSON.stringify(['/uploads/products/logo-design.jpg']),
      thumbnailUrl: '/uploads/products/logo-design.jpg',
      slug: 'logo-design',
      status: 'published',
      views: 120,
      sales: 28,
    },
  });

  const product3 = await prisma.vendorProduct.create({
    data: {
      vendorApplicationId: vendor1.id,
      title: 'Mobile App Development',
      description: 'Full-stack mobile app development',
      category: 'development',
      price: 2000,
      images: JSON.stringify(['/uploads/products/mobile-app.jpg']),
      thumbnailUrl: '/uploads/products/mobile-app.jpg',
      slug: 'mobile-app-development',
      status: 'published',
      views: 89,
      sales: 5,
    },
  });

  console.log('Vendor products created:', product1.title, product2.title, product3.title);

  // Create blog posts
  const blog1 = await prisma.blogPost.upsert({
    where: { slug: 'welcome-to-lumynis' },
    update: {},
    create: {
      slug: 'welcome-to-lumynis',
      title: 'Welcome to Lumynis',
      excerpt: 'Start your journey with us',
      content: 'This is the beginning of something great. Lumynis is here to help you achieve your goals.',
      date: new Date('2025-12-01'),
    },
  });

  const blog2 = await prisma.blogPost.upsert({
    where: { slug: 'getting-started' },
    update: {},
    create: {
      slug: 'getting-started',
      title: 'Getting Started Guide',
      excerpt: 'Learn the basics',
      content: 'Here is a comprehensive guide to get you started with our platform.',
      date: new Date('2025-12-02'),
    },
  });

  const blog3 = await prisma.blogPost.upsert({
    where: { slug: 'design-tips' },
    update: {},
    create: {
      slug: 'design-tips',
      title: '10 Design Tips for Success',
      excerpt: 'Learn the best practices in modern design',
      content: 'Discover the top 10 design principles that will take your work to the next level.',
      date: new Date('2025-12-03'),
    },
  });

  console.log('Blog posts created:', blog1.title, blog2.title, blog3.title);

  // Create products
  const prod1 = await prisma.product.upsert({
    where: { productId: 'PROD-001' },
    update: {},
    create: {
      productId: 'PROD-001',
      name: 'Premium Plan',
      price: 99.99,
      category: 'subscription',
    },
  });

  const prod2 = await prisma.product.upsert({
    where: { productId: 'PROD-002' },
    update: {},
    create: {
      productId: 'PROD-002',
      name: 'Business Plan',
      price: 199.99,
      category: 'subscription',
    },
  });

  console.log('Products created:', prod1.name, prod2.name);

  // Create requests
  const request1 = await prisma.request.create({
    data: {
      title: 'Feature Request: Dark Mode',
      description: 'We need a dark mode for better accessibility',
      status: 'open',
      userId: user1.id,
    },
  });

  const request2 = await prisma.request.create({
    data: {
      title: 'Bug Report: Login Issue',
      description: 'Some users cannot login with special characters in password',
      status: 'in-progress',
      userId: user2.id,
    },
  });

  const request3 = await prisma.request.create({
    data: {
      title: 'Développement - E-Commerce Store',
      description: 'Je besoin d\'une plateforme e-commerce complète avec paiement Stripe',
      budget: '5000-10000€',
      templateId: 1,
      status: 'open',
      userId: user4.id,
    },
  });

  console.log('Requests created:', request1.title, request2.title, request3.title);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
