# CleanFlow Project Functionality Overview

CleanFlow is an enterprise-grade, multi-tenant SaaS platform designed for high-end dry cleaning businesses and chains. It combines a sophisticated Point-of-Sale (POS) system with deep operational controls, inventory intelligence, and cloud-scale cluster management.

---

## 1. Core POS & Order Management
The front-of-house engine for retail operations.

- **Order Ledger**: A centralized registry of all dry cleaning transactions with advanced filtering by status (Ready, Processing, Received, etc.).
- **Walk-in Pickup Flow**: Rapid order creation interface for front-desk staff, supporting garment selection, service types, and automated pricing.
- **Financial Settlement**: Support for multiple payment methods (Cash, Card, UPI, Online) with real-time settlement status tracking (Paid, Pending, Partial).
- **Service Catalog**: Dynamic pricing management for various garment types (Shirts, Suits, Dresses) across specialized services (Dry Cleaning, Intensive Wash, Steam Press).

## 2. Floor Control (Production Workflow)
The real-time production monitoring and control system (Back-of-House).

- **8-Stage Processing Kanban**: Tracks every garment through a deterministic lifecycle:
  1. **In-Take**: Initial receipt and tagging.
  2. **Sorting**: Item categorization.
  3. **Wash**: Standard aqueous cleaning.
  4. **Dry Clean**: Solvent-based specialized cleaning.
  5. **Drying**: Temperature-controlled moisture removal.
  6. **Ironing**: Steam-press and finishing.
  7. **Quality**: Detailed inspection.
  8. **Ready**: Bagging and final verification.
- **Role-based Guardrails**: Managers can advance items through stages, while Staff can view the live production floor status.

## 3. Inventory & Resource Control
Intelligent resource management with predictive analytics.

- **Stock Level Monitoring**: Real-time tracking of consumables like Detergents, Solvents, Hangers, and Garment Bags.
- **Runway Forecasts**: Automated predictions for "Days Remaining" based on historical consumption patterns.
- **Stock Ingestion**: Modals for receiving bulk manifests and declaring new resource types.
- **System Audits**: Physical audit interface to recalibrate digital stock levels with physical reality, ensuring A.I. accuracy.

## 4. Logistics Hub
The fleet and dispatch management command center.

- **Dual-Track Dispatch**: Separate management flows for **Pending Pickups** (incoming) and **Pending Deliveries** (outgoing).
- **Fleet Control**: Live status tracking for drivers (Scheduled vs. In-Transit).
- **Navigation Integration**: Deep-linking to Google Maps for precise location dispatch.
- **Logistics Notes**: Per-order delivery instructions (e.g., "Gate code: 1234").

## 5. Master Control (Superadmin Portfolio)
The multi-tenant node management system for platform owners.

- **Node Provisioning**: High-level deployment of new store instances (Nodes) to the cluster.
- **Cluster Hierarchy**: A unified view of all Business Owners and their respective Dry Cleaning Chains.
- **Tier Management**: Dynamic reconfiguration of subscription tiers (Software, Hardware, Enterprise) with feature-gating.
- **System Observability**: Real-time monitoring of cluster-wide health (CPU, Memory) and transactional logs.
- **Global Broadcast**: Ability to send system-wide notifications to all active nodes.

## 6. Business Identity & Admin
Branding and security configurations.

- **Whitelabeling**: Dynamic system name and logo management via the Branding Context.
- **Access Reset**: Secure PIN reset mechanisms for Store Managers across the cluster.
- **Localization**: Support for multilingual interfaces (English, Hindi, etc.).

## 7. Customer Relationship Management (CRM)
- **Customer Profiles**: Detailed history of orders, preferences, and loyalty points.
- **Engagement History**: Tracking customer registration age and order frequency.
