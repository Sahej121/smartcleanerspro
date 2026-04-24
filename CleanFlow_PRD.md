# CleanFlow – Dry Cleaner Management System
## Product Requirements Document (PRD)

**Version:** 1.0  
**Author:** Sahej  
**Date:** March 2026

---

## 1. Product Overview

CleanFlow is a cloud-based software platform designed for dry cleaning businesses worldwide to manage operations efficiently.

The system is divided into two main components:

* **Front of the House (FOH):** Customer-facing operations like order creation, billing, order tracking, and customer communication.
* **Back of the House (BOH):** Internal operations such as garment processing workflow, staff management, quality control, and logistics.

The software will also integrate with the WhatsApp Business API to automate customer communication like order confirmations, status updates, and pickup notifications.

---

## 2. Goals & Objectives

### Business Goals
* Digitize dry cleaning operations globally
* Reduce manual tracking errors
* Improve operational efficiency
* Improve customer communication
* Enable scalable SaaS subscription model

### User Goals
Dry cleaner owners want:
* Simple POS system
* Order tracking
* Garment tagging
* Customer communication automation
* Staff workflow management

---

## 3. Target Users

### Primary Users
* Dry cleaner shop owners
* Store managers
* Front desk employees
* Laundry processing staff

### Secondary Users
* Customers
* Delivery drivers

---

## 4. Product Architecture

System features:
* Web Dashboard (Admin + Back of House)
* POS Interface (Front Desk)
* Mobile-friendly interface
* WhatsApp Integration Layer
* Cloud Database
* API Layer

**Recommended Stack:**
* **Frontend:** React / Next.js
* **Backend:** Node.js / Python
* **Database:** PostgreSQL
* **Hosting:** AWS / Vercel
* **Messaging:** WhatsApp Business API

---

## 5. Front of the House (FOH) Features

### 5.1 POS Order Creation
Front desk employee can:
* Add customer
* Select garment types (e.g., Shirt, Suit, Dress, Coat, Curtains, Blanket)
* Select services (e.g., Dry cleaning, Washing, Ironing, Stain removal, Express service)
* Generate receipt

### 5.2 Customer Management
Customer profile includes:
* Name, Phone number, Email, Address
* Order history
* Notes (allergies, fabric care, etc.)

### 5.3 Billing & Payments
Supported payments: Cash, Card, UPI, Online payments.
Features:
* Invoice generation
* Discount codes
* Loyalty points
* Tax support (country-specific)

### 5.4 Receipt & Tagging
Each order generates:
* Order ID
* QR code / Barcode
* Garment tags (attached to garments for BOH tracking)

### 5.5 Order Tracking
Customers and staff can see order status:
* Received -> Washing -> Dry Cleaning -> Ironing -> Quality Check -> Ready for Pickup -> Delivered

### 5.6 WhatsApp Integration
Automated messages using WhatsApp Business API.
Events:
* Order Confirmation (e.g., "Hi John, your order #1234 is ready for pickup.")
* Order In Process
* Ready for Pickup
* Out for Delivery
* Delivery Confirmation

Features:
* Automated notifications
* Order status queries via WhatsApp
* Pickup reminders

---

## 6. Back of the House (BOH) Features

### 6.1 Garment Workflow Management
BOH staff see garments in stages (Kanban style).
Pipeline:
* Received -> Sorting -> Washing -> Dry Cleaning -> Drying -> Ironing -> Quality Check -> Ready
Each stage updates the system status.

### 6.2 Garment Scanning
Staff scan Garment tag (QR code / Barcode) to:
* Update stage
* Track garment
* Prevent loss

### 6.3 Staff Management
Managers can:
* Add employees
* Assign tasks
* Track productivity (e.g., garments processed per employee, turnaround time)

### 6.4 Machine Tracking
Track machines like: Washing machines, Dryers, Steam press, Dry cleaning machine.
Features:
* Load tracking
* Machine usage analytics

### 6.5 Quality Control
Quality inspector checks:
* Stains removed
* Fabric damage
* Ironing quality
*If rejected: return to cleaning stage.*

### 6.6 Inventory Management
Track consumables: Detergent, Solvents, Packaging, Hangers.
Features: Alerts when stock is low.

---

## 7. Delivery & Logistics (Optional Module)
Features:
* Delivery route planning
* Driver tracking
* Pickup scheduling
* Delivery confirmation
* Drivers use mobile interface with Google Maps integration

---

## 8. Analytics Dashboard
Owners see:
* **Revenue analytics:** Daily sales, monthly revenue, average order value
* **Operations analytics:** Turnaround time, garments processed, busiest days
* **Customer analytics:** Repeat customers, lifetime value

---

## 9. Multi-Store Support
For chains. Features:
* Manage multiple locations
* Centralized dashboard
* Store-level analytics

---

## 10. Security Requirements
* Role-based access control (Owner, Manager, Front desk, Staff, Driver)
* Encrypted payments
* GDPR compliant
* Secure customer data storage

---

## 11. Performance Requirements
System should:
* Support 1000+ stores
* Handle 10k orders/day
* Real-time order updates
* 99.9% uptime

---

## 12. Integrations
* **Messaging:** WhatsApp Business API
* **Payments:** Stripe, Razorpay, Square
* **Hardware:** POS printers, Barcode scanners, QR scanners

---

## 13. Future Features
**Phase 2:**
* Customer mobile app
* AI stain detection, garment image recognition
* Automated machine integration

**Phase 3:**
* Marketplace for dry cleaners
* Subscription pickup plans
* AI demand forecasting

---

## 14. Monetization Model
SaaS subscription. Example pricing:
* **Starter:** $29/month (1 store)
* **Growth:** $79/month (3 stores)
* **Enterprise:** Custom pricing

---

## 15. Success Metrics (KPIs)
* Number of active stores
* Monthly recurring revenue
* Order processing time
* Customer retention
* WhatsApp engagement rate

---

## 16. UI / UX Structure

Your system should have 4 interfaces:
1. Front Desk POS (FOH)
2. Back-of-House Operations (BOH)
3. Admin / Owner Dashboard
4. Driver / Delivery App (optional)

### 16.1 FOH Screens
* **POS Dashboard:** Left panel (Navigation), Main area (Current order creation), Right panel (Order summary & Total).
* **New Order Screen:** Customer -> Garments -> Services -> Payment. Generates ID, QR, tags.
* **Customer Profile Screen:** Details, order history, loyalty points.
* **Orders Screen:** Filter by status (Pending, Ready, etc.).
* **Payment Screen:** Invoice summary, Cash/Card/UPI.

### 16.2 BOH Screens
* **Operations Dashboard:** Workflow stages in a Kanban board. Staff scan QR codes to move items.
* **Garment Scanner Screen:** Scan QR -> Show Garment, ID, Stage -> Move to next stage.
* **Quality Control Screen:** View garment image & notes -> Approve / Reject.
* **Machine Load Screen:** Show machine status, current load, and ETA.

### 16.3 Admin / Owner Dashboard
* **Analytics Dashboard:** Revenue today, Orders today, Garments processed, Average turnaround time.
* **Staff Management Screen:** Add employees, assign roles and shifts.
* **Pricing Management:** Set pricing for services and garments.
* **Multi-Store Management:** Store list, Revenue per store, Staff per store.

### 16.4 Delivery / Driver App
* Today's deliveries, pickup requests, Map navigation, Capture signature, Mark picked up/delivered.

---

## 17. WhatsApp Automation Flows
Automated events:
* **Order Created:** "Hi John! Your order #1023 has been received."
* **Order Processing:** "Your clothes are being cleaned."
* **Ready for Pickup:** "Your clothes are ready for pickup."
* **Out for Delivery:** "Your order is out for delivery."
* **Delivered:** "Your order has been delivered."

---

## 18. Database Schema (Core Tables)

### USERS
`id`, `name`, `email`, `phone`, `role`, `store_id`, `password_hash`, `created_at`

### STORES
`id`, `store_name`, `address`, `city`, `country`, `phone`, `owner_id`

### CUSTOMERS
`id`, `name`, `phone`, `email`, `address`, `loyalty_points`, `notes`, `created_at`

### ORDERS
`id`, `order_number`, `customer_id`, `store_id`, `status` (received, processing, ready, delivered), `total_amount`, `payment_status`, `pickup_date`, `delivery_date`, `created_at`

### ORDER_ITEMS (Garments)
`id`, `order_id`, `garment_type`, `service_type`, `price`, `status`

### GARMENT_WORKFLOW
`id`, `order_item_id`, `stage` (sorting, washing, dry_cleaning, drying, ironing, quality_check), `updated_by`, `timestamp`

### PAYMENTS
`id`, `order_id`, `amount`, `payment_method` (cash, card, upi, online), `transaction_id`, `payment_status`, `created_at`

### INVENTORY (Consumables)
`id`, `item_name`, `quantity`, `unit`, `reorder_level`

### MACHINES
`id`, `machine_name`, `machine_type` (washer, dryer, dry_clean_machine), `status`, `store_id`

### MACHINE_LOADS
`id`, `machine_id`, `order_item_id`, `start_time`, `end_time`, `status`

### DELIVERY
`id`, `order_id`, `driver_id`, `status`, `pickup_time`, `delivery_time`

### WHATSAPP_LOGS
`id`, `customer_id`, `order_id`, `message_type`, `message_content`, `status`, `sent_at`

---

## 19. MVP Features (First Version)
To launch quickly (8–12 weeks), build only:
* **FOH:** POS, Orders, Customers, Payments
* **BOH:** Garment tracking, QR scanning
* **Automation:** WhatsApp notifications
* **Admin:** Basic analytics
