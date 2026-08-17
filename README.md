# Food Safety Guardian

🧠 MASTER PROMPT – Food Safety Violations System (Arabic)

Build a full Arabic web application (RTL) called:

"نظام إدارة مخالفات سلامة الغذاء"

This is a developer-only internal system used for managing food safety violations in factories.

⚠️ IMPORTANT RULES

1. Single User System

 Only ONE user exists: the Developer (Admin)

 No other users

 No roles

 No permissions system

2. Developer Mode Only UI

 The system always runs in “Developer Mode”

 All CRUD controls must ALWAYS be visible ONLY to developer:

 ➕ إضافة

 ✏️ تعديل

 🗑️ حذف

3. Language

 Entire UI MUST be in Arabic

 Full RTL support

🧭 STEP-BY-STEP BUILD STRUCTURE (IMPORTANT FOR LOVABLE)

Build the app in this order:

STEP 1: Authentication

Create a simple login page:

 Email

 Password

 One account only (Developer)

After login → open full system.

STEP 2: Employees Module

Create Employees management system:

Fields:

 الاسم

 الكود

 القسم

 الوظيفة

 النوع (دائم / يومي)

Features:

 إضافة موظف

 تعديل موظف

 حذف موظف

 رفع Excel file

 بحث سريع بالعربي

STEP 3: Violations Module

Create violations system:

Fields:

 اسم العامل

 الكود

 القسم

 نوع المخالفة

 مستوى الخطورة

 اسم المفتش

 ملاحظات

 صورة

 الحالة

 التاريخ

Features:

 إضافة مخالفة

 تعديل مخالفة

 حذف مخالفة

 فلترة حسب العامل / القسم / التاريخ

STEP 4: Violation Types Module

Manage violation types:

 إضافة نوع مخالفة

 تعديل نوع

 حذف نوع

Examples:

 عدم ارتداء القفازات

 سوء النظافة

 التلوث المتبادل

STEP 5: Dashboard (Arabic Analytics)

Create dashboard with:

KPIs:

 إجمالي المخالفات

 أكثر عامل مخالف

 أكثر قسم مخالف

 المخالفات المفتوحة

 المخالفات المغلقة

Charts:

 أنواع المخالفات

 المخالفات عبر الوقت

 أكثر العمال مخالفة

STEP 6: Employee Profile Page

Each employee page shows:

 جميع المخالفات

 عدد المخالفات

 مستوى الخطورة

 أكثر مخالفة تكرارًا

STEP 7: Audit Log

Track all actions:

 إضافة

 تعديل

 حذف

 تسجيل دخول

STEP 8: Export System

 Export Excel

 Export PDF

 Daily / Weekly / Monthly reports

STEP 9: UI/UX Design Requirements

 Clean modern admin dashboard

 Arabic RTL layout

 Very simple navigation

 Mobile friendly

Main menu:

 تسجيل مخالفة

 الموظفين

 التقارير

 لوحة التحكم

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://masar-alsalama-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/742dfcd6-402a-4093-9952-52a63e59f452).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
