# Thainexsweetie - Context & Guidelines

## Project Overview
โปรเจกต์ระบบสั่งอาหารร้านขนมหวาน "Thainexsweetie" สร้างด้วย Next.js (App Router, JavaScript) เชื่อมต่อกับ Supabase และ Deploy บน Vercel

## Database Schema (สำหรับอ้างอิง)
1. **sessions**: `id`, `table_number`, `adult_count`, `child_count`, `status`, `created_at`
2. **menu_categories**: `id`, `name`, `sort_order`
3. **menu_items**: `id`, `category_id`, `name`
4. **orders**: `id`, `session_id`, `table_number`, `items` (jsonb), `status`, `created_at`

## Important Technical Rules (Next.js 15+)
- โปรเจกต์นี้ใช้ Next.js เวอร์ชันล่าสุด
- ใน Client / Server Components ที่รับ `params` จาก Dynamic Route (เช่น `/order/[tableNumber]`):
  - **`params` เป็น Promise**
  - ต้อง unwrap ค่าด้วย `use()` hook จาก React ก่อนใช้งานเสมอ เช่น:
    ```javascript
    'use client'
    import { use } from 'react'

    export default function OrderPage({ params }) {
      const { tableNumber } = use(params)
      // ...
    }
    ```
