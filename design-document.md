**Intelligent Tenant Engagement & Assistant**

Pilot --- System Design Document

Version 1.0 \| March 2026 \| CONFIDENTIAL

*Independent Consultant Engagement --- CPN (Central Pattana)*

**1. Purpose & Scope**

This document specifies the system design for the Intelligent Tenant Engagement & Assistant pilot. It covers user stories suitable for driving test case design, the complete technology stack for the pilot, Firestore data schemas, FastAPI endpoint contracts, and the mock data specification required to operate the system before CPN internal data is available.

**Problem:** Prospective tenants contact CPN's leasing team but receive slow or no response, resulting in lost leads. The call centre lacks tooling to quickly match merchant profiles to available units across 35+ malls.

**Proposed solution:** Two AI-powered components: (1) a customer-facing chatbot that handles inbound inquiries 24/7 and captures qualified leads, and (2) an internal AI assistant that gives call centre and sales staff instant access to unit recommendations, lead context, and scoring.

**1.1 In Scope --- Pilot**

-   Component A: Customer-facing AI Chatbot (web + LINE-ready interface)

-   Component B: Internal AI Assistant for call centre / leasing staff

-   Lead capture, scoring, and notification pipeline

-   Admin panel: knowledge base management, unit availability updates

-   Mock data set covering 7 CPN malls, 210 units, pricing tiers, and lease terms

**1.2 Out of Scope --- Pilot**

-   Telephony / IVR integration (voice channel --- Phase 2)

-   Full Salesforce CRM bi-directional sync (Phase 2)

-   Predictive demand forecasting (Phase 2)

-   Mobile native apps

**2. System Architecture**

The pilot uses a three-tier architecture: a React/TypeScript frontend hosted on Firebase Hosting, a Python/FastAPI backend deployed on Cloud Run, and Firebase services (Auth, Firestore) as the managed backend-as-a-service layer. A RAG (Retrieval-Augmented Generation) pipeline connects the LLM to the CPN knowledge base stored in Firestore and a vector index.

+-------------------+---------------------------------------+----------------------------------------------+----------------------------+
| **Layer**         | **Component**                         | **Technology**                               | **Hosting**                |
+-------------------+---------------------------------------+----------------------------------------------+----------------------------+
| **Presentation**  | Customer Chatbot (Component A)        | React 18 + TypeScript + Vite                 | Firebase Hosting           |
|                   |                                       |                                              |                            |
|                   | Internal Assistant (Component B)      | Tailwind CSS + shadcn/ui                     |                            |
|                   |                                       |                                              |                            |
|                   | Admin Panel                           | Firebase SDK v10                             |                            |
+-------------------+---------------------------------------+----------------------------------------------+----------------------------+
| **API / RAG**     | REST API endpoints                    | Python 3.12 + FastAPI                        | Cloud Run (min 1 instance) |
|                   |                                       |                                              |                            |
|                   | WebSocket chat session                | LangChain 0.3                                |                            |
|                   |                                       |                                              |                            |
|                   | RAG orchestration                     | OpenAI API (GPT-4o + text-embedding-3-small) |                            |
|                   |                                       |                                              |                            |
|                   | LLM provider abstraction              | aisuite (github.com/andrewyng/aisuite)       |                            |
|                   |                                       |                                              |                            |
|                   | Lead scoring engine                   | Pydantic v2                                  |                            |
+-------------------+---------------------------------------+----------------------------------------------+----------------------------+
| **Data & Auth**   | Structured data (malls, units, leads) | Firestore (NoSQL)                            | Firebase / GCP             |
|                   |                                       |                                              |                            |
|                   | Conversation history                  | Firebase Authentication                      |                            |
|                   |                                       |                                              |                            |
|                   | User accounts & roles                 | Pinecone Serverless (vector DB)              |                            |
|                   |                                       |                                              |                            |
|                   | Vector index (knowledge base)         | Firebase Storage (docs)                      |                            |
+-------------------+---------------------------------------+----------------------------------------------+----------------------------+
| **Notifications** | Lead alerts to sales reps             | Firebase Cloud Messaging (FCM)               | Firebase / SendGrid        |
|                   |                                       |                                              |                            |
|                   | High-priority lead escalation         | Email via SendGrid (backup)                  |                            |
+-------------------+---------------------------------------+----------------------------------------------+----------------------------+

**2.1 Data Flow --- Component A (Chatbot)**

1.  Visitor opens chatbot widget on CPN leasing portal.

2.  Firebase Auth creates anonymous session. Session ID stored in Firestore conversations/{sessionId}.

3.  User message sent via POST /api/v1/chat/{sessionId}/message.

4.  FastAPI RAG pipeline: embed query → Pinecone similarity search (k=5) → retrieve context chunks → GPT-4o generates response with system prompt constraining it to CPN leasing knowledge.

5.  Response streamed back to frontend via server-sent events (SSE).

6.  Conversation turn persisted to Firestore.

7.  Lead qualification check: if name + contact extracted → create lead document, trigger FCM push to assigned sales rep.

**2.2 Data Flow --- Component B (Internal Assistant)**

8.  Call centre agent logs in via Google SSO (Firebase Auth with custom claims: role=agent\|sales\|admin).

9.  Agent opens a lead or starts a new merchant consultation.

10. Agent submits merchant profile (business type, preferred area, size, budget).

11. POST /api/v1/recommend sends profile to FastAPI.

12. FastAPI: embed profile → Pinecone search → query Firestore for matching available units → rank by lead score model → return top-5 recommendations.

13. Lead score computed (business type fit × budget alignment × urgency signals).

14. Agent views recommendations, selects preferred units, marks lead status.

**3. Technology Stack**

**3.1 Frontend**

  ---------------------------- ------------------ -----------------------------------------------
  **Package**                  **Version**        **Purpose**

  **react**                    18.3               UI rendering

  **typescript**               5.4                Type safety

  **vite**                     5.2                Build tooling

  **tailwindcss**              3.4                Utility-first styling

  **\@shadcn/ui**              latest             Accessible UI component library

  **firebase**                 10.11              Auth, Firestore, FCM, Hosting SDK

  **zustand**                  4.5                Lightweight global state (chat session, user)

  **\@tanstack/react-query**   5.x                Server state, caching, mutations

  **react-router-dom**         6.x                Client-side routing

  **react-markdown**           9.x                Render LLM markdown responses

  **dayjs**                    1.11               Date formatting (lease dates, timestamps)

  **recharts**                 2.12               Lead pipeline dashboard charts
  ---------------------------- ------------------ -----------------------------------------------

**3.2 Backend**

  ---------------------- ------------------ ----------------------------------------------
  **Package**            **Version**        **Purpose**

  **python**             3.12               Runtime

  **fastapi**            0.111              ASGI web framework

  **uvicorn**            0.29               ASGI server (with gunicorn in prod)

  **pydantic**           2.7                Request / response validation

  **aisuite**            latest             Unified LLM provider abstraction (OpenAI, Anthropic, etc.); model strings use "provider:model" format (e.g. "openai:gpt-4o")

  **langchain**          0.3                RAG orchestration, prompt management

  **langchain-openai**   0.1                OpenAI LLM + embedding integration

  **openai**             1.30               Direct API calls (streaming, embeddings)

  **pinecone-client**    4.1                Vector store (upsert + query)

  **firebase-admin**     6.5                Firestore read/write, FCM, Auth token verify

  **python-jose**        3.3                JWT decode for Firebase custom claims

  **httpx**              0.27               Async HTTP (external webhook calls)

  **python-multipart**   0.0.9              File upload (admin knowledge base)

  **sse-starlette**      2.1                Server-sent events for streaming chat

  **tenacity**           8.3                Retry logic for OpenAI rate limits
  ---------------------- ------------------ ----------------------------------------------

**3.3 Firebase Services**

  ------------------------------ ------------------- -----------------------------------------------------------------------------------
  **Service**                    **Tier**            **Usage**

  **Firebase Hosting**           Spark (free)        Static SPA hosting, CDN, custom domain

  **Firebase Authentication**    Free                Anonymous auth (chatbot visitors), Google SSO (internal staff)

  **Firestore**                  Blaze (pay-as-go)   Primary data store: malls, units, leads, conversations, knowledge chunks metadata

  **Firebase Storage**           Blaze               Admin-uploaded PDFs (sales kits, T&C documents) before indexing into Pinecone

  **Firebase Cloud Messaging**   Free                Push notifications to sales rep web app on new high-priority lead
  ------------------------------ ------------------- -----------------------------------------------------------------------------------

**3.4 External Services**

-   OpenAI API --- GPT-4o (generation) + text-embedding-3-small (1536-dim embeddings for all knowledge base chunks)

-   Pinecone Serverless --- vector index named cpn-kb; namespace per content type (units, terms, sales-kit)

-   Google Cloud Run --- FastAPI container, auto-scales 1--5 instances, 2 vCPU / 2 GB RAM per instance

**4. User Roles & Access Control**

  ---------------------- ----------------- -------------------- ------------------------------------------------------------------------------------------
  **Role**               **Auth Method**   **Firebase Claim**   **Access**

  **Guest (Prospect)**   Anonymous         role: guest          Component A chatbot only; cannot see internal data

  **Agent**              Google SSO        role: agent          Component B assistant; view leads assigned to their queue; update lead status

  **Sales Rep**          Google SSO        role: sales          All Agent permissions + view all leads + export CSV + receive FCM alerts

  **Admin**              Google SSO        role: admin          All permissions + upload knowledge base docs + manage unit availability + view analytics
  ---------------------- ----------------- -------------------- ------------------------------------------------------------------------------------------

Firebase custom claims are set by the FastAPI backend's admin endpoint on user creation. Claims are verified server-side on every protected API request by decoding the Firebase ID token.

**5. User Stories**

Stories are organized by Epic. Each story carries a unique ID (format US-XXX) and a set of acceptance criteria designed to be directly translatable into test cases (unit, integration, or E2E).

**Epic 1 --- Tenant Chatbot (Component A)**

Covers all interactions by prospective tenants (guests) via the public-facing chatbot.

+-------------------------------------------------------------------------------------------------+
| **US-001** As a prospective tenant, I want to start a chat session without creating an account, |
|                                                                                                 |
| *so that I can enquire about leasing without friction.*                                         |
|                                                                                                 |
| **Acceptance Criteria:**                                                                        |
|                                                                                                 |
| A.  System creates an anonymous Firebase Auth session on first page load.                       |
|                                                                                                 |
| B.  A unique sessionId is written to Firestore conversations/{sessionId} with status: active.   |
|                                                                                                 |
| C.  The chat UI renders within 2 seconds on a standard 4G connection.                           |
|                                                                                                 |
| D.  No personal information is required before the first message can be sent.                   |
+-------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------------+
| **US-002** As a prospective tenant, I want to ask about available rental spaces in natural language (Thai or English),                      |
|                                                                                                                                             |
| *so that I can explore options in my preferred language without reformatting my question.*                                                  |
|                                                                                                                                             |
| **Acceptance Criteria:**                                                                                                                    |
|                                                                                                                                             |
| E.  The chatbot correctly responds in the same language as the user's input (Thai input → Thai response, English input → English response). |
|                                                                                                                                             |
| F.  Responses reference specific available units from the Firestore units collection.                                                       |
|                                                                                                                                             |
| G.  Response latency is ≤10 seconds from message send to first token displayed.                                                             |
|                                                                                                                                             |
| H.  If no units match the criteria, the bot responds with an informative fallback and asks a clarifying question.                           |
|                                                                                                                                             |
| I.  No hallucinated unit details: every unit ID, price, and size in the response must exist in Firestore.                                   |
+---------------------------------------------------------------------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **US-003** As a prospective tenant, I want to receive unit recommendations based on my business type and preferred location,                                          |
|                                                                                                                                                                       |
| *so that I can narrow down options without manually browsing a listing database.*                                                                                     |
|                                                                                                                                                                       |
| **Acceptance Criteria:**                                                                                                                                              |
|                                                                                                                                                                       |
| J.  When the user states a business type (e.g., 'coffee shop', 'fashion brand'), the system retrieves units with matching merchant_category or compatible_categories. |
|                                                                                                                                                                       |
| K.  Recommendations include: mall name, floor, unit code, size (sqm), indicative rent (THB/sqm/month), and zone.                                                      |
|                                                                                                                                                                       |
| L.  At least 3 recommendations returned when matching units exist.                                                                                                    |
|                                                                                                                                                                       |
| M.  Recommendations ranked by: (1) location match, (2) size fit, (3) price range fit.                                                                                 |
|                                                                                                                                                                       |
| N.  User can ask 'show me smaller ones' or 'within 50,000 THB/month' as follow-up and receive refined results.                                                        |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **US-004** As a prospective tenant, I want to ask about leasing terms, required documents, and deposit conditions,                                                                  |
|                                                                                                                                                                                     |
| *so that I can assess whether to proceed before speaking to a sales rep.*                                                                                                           |
|                                                                                                                                                                                     |
| **Acceptance Criteria:**                                                                                                                                                            |
|                                                                                                                                                                                     |
| O.  Bot correctly states minimum lease term (1 year), standard term (3 years), and deposit requirements (3 months + 1 month advance rent) from the terms_conditions knowledge base. |
|                                                                                                                                                                                     |
| P.  Bot lists required documents for application: company registration (for juristic persons), ID card, bank statements (6 months), business plan summary.                          |
|                                                                                                                                                                                     |
| Q.  Bot does not fabricate payment amounts: all figures must reference the terms_conditions collection or be stated as 'varies by unit'.                                            |
|                                                                                                                                                                                     |
| R.  Bot offers to connect user with a sales rep to get exact figures for a specific unit.                                                                                           |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+---------------------------------------------------------------------------------------------------------------------------------------+
| **US-005** As a prospective tenant, I want to provide my contact details within the chat so a sales rep can follow up,                |
|                                                                                                                                       |
| *so that I do not need to fill out a separate form or navigate away from the conversation.*                                           |
|                                                                                                                                       |
| **Acceptance Criteria:**                                                                                                              |
|                                                                                                                                       |
| S.  When user provides name + phone number (or email), the system creates a leads/{leadId} document in Firestore.                     |
|                                                                                                                                       |
| T.  Lead document captures: contact info, session transcript summary, interested_units\[\], lead_score, created_at.                   |
|                                                                                                                                       |
| U.  User receives confirmation message: 'Thank you \[Name\], a leasing specialist will contact you within 1 business day.'            |
|                                                                                                                                       |
| V.  FCM push notification is sent to all users with role: sales within 30 seconds of lead creation.                                   |
|                                                                                                                                       |
| W.  Duplicate check: if same phone number exists in leads within 30 days, the existing lead is updated rather than a new one created. |
+---------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------+
| **US-006** As a prospective tenant, I want to resume a previous chat session when I return to the page,                                  |
|                                                                                                                                          |
| *so that I do not have to repeat context I already provided.*                                                                            |
|                                                                                                                                          |
| **Acceptance Criteria:**                                                                                                                 |
|                                                                                                                                          |
| X.  If the browser retains the Firebase anonymous session (localStorage token), the chat UI reloads the last 20 messages from Firestore. |
|                                                                                                                                          |
| Y.  The system correctly identifies returning user context in subsequent RAG queries.                                                    |
|                                                                                                                                          |
| Z.  Session expiry: anonymous sessions inactive for 30 days are archived (status: expired), and a new session is started on next visit.  |
+------------------------------------------------------------------------------------------------------------------------------------------+

**Epic 2 --- Internal AI Assistant (Component B)**

Covers all interactions by authenticated CPN staff (agents, sales reps).

+---------------------------------------------------------------------------------------------------+
| **US-007** As a call centre agent, I want to log in using my CPN Google Workspace account,        |
|                                                                                                   |
| *so that I do not need to manage a separate password.*                                            |
|                                                                                                   |
| **Acceptance Criteria:**                                                                          |
|                                                                                                   |
| A.  Google SSO via Firebase Authentication succeeds for any \@centralpattana.co.th email.         |
|                                                                                                   |
| B.  On first login, FastAPI creates a users/{uid} document and assigns role: agent by default.    |
|                                                                                                   |
| C.  Login redirect returns user to the agent dashboard, not the customer chatbot.                 |
|                                                                                                   |
| D.  Invalid domain emails (non-CPN) are rejected with error: 'Access restricted to CPN accounts.' |
+---------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **US-008** As a call centre agent, I want to view a real-time list of incoming leads with their inquiry summaries,                                         |
|                                                                                                                                                            |
| *so that I can triage and respond to the most urgent prospects first.*                                                                                     |
|                                                                                                                                                            |
| **Acceptance Criteria:**                                                                                                                                   |
|                                                                                                                                                            |
| E.  Lead list updates in real time via Firestore onSnapshot listener; no page refresh required.                                                            |
|                                                                                                                                                            |
| F.  Each lead card displays: prospect name, contact, business type, lead score (0--100), status (new/contacted/qualified/closed), and time since creation. |
|                                                                                                                                                            |
| G.  Leads with score ≥75 are highlighted with a visual badge.                                                                                              |
|                                                                                                                                                            |
| H.  Agent can filter by: status, mall preference, lead score range, and date range.                                                                        |
|                                                                                                                                                            |
| I.  Lead list is paginated: 20 per page with infinite scroll.                                                                                              |
+------------------------------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------+
| **US-009** As a call centre agent, I want to open a lead and see the full chat transcript plus AI-generated inquiry summary, |
|                                                                                                                              |
| *so that I have complete context before calling the prospect.*                                                               |
|                                                                                                                              |
| **Acceptance Criteria:**                                                                                                     |
|                                                                                                                              |
| J.  Lead detail view renders the full conversation transcript in chronological order.                                        |
|                                                                                                                              |
| K.  AI-generated summary (2--3 sentences) is shown above the transcript, produced by GPT-4o from the conversation turns.     |
|                                                                                                                              |
| L.  Interested units listed as chips with click-to-expand unit detail.                                                       |
|                                                                                                                              |
| M.  Agent can add a private note to the lead record (not visible to the prospect).                                           |
|                                                                                                                              |
| N.  Summary generation time ≤5 seconds from opening the lead.                                                                |
+------------------------------------------------------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------------------------------------------------------------------------+
| **US-010** As a call centre agent, I want to query the AI assistant with a merchant profile and receive unit recommendations,                   |
|                                                                                                                                                 |
| *so that I can advise a prospect on the phone without manually searching spreadsheets.*                                                         |
|                                                                                                                                                 |
| **Acceptance Criteria:**                                                                                                                        |
|                                                                                                                                                 |
| O.  Agent submits: business_type, preferred_mall (optional), size_range_sqm, monthly_budget_thb.                                                |
|                                                                                                                                                 |
| P.  System returns top-5 matching available units with: unit_code, mall, floor, zone, size, base_rent, service_charge, earliest_available_date. |
|                                                                                                                                                 |
| Q.  Results exclude units with status ≠ available.                                                                                              |
|                                                                                                                                                 |
| R.  Response time ≤10 seconds.                                                                                                                  |
|                                                                                                                                                 |
| S.  Agent can pin a recommendation to the lead record for follow-up.                                                                            |
+-------------------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------+
| **US-011** As a sales representative, I want to receive a push notification on my browser when a new high-priority lead is captured, |
|                                                                                                                                      |
| *so that I can respond within the hour rather than checking the dashboard periodically.*                                             |
|                                                                                                                                      |
| **Acceptance Criteria:**                                                                                                             |
|                                                                                                                                      |
| T.  FCM push delivered to all active browser sessions with role: sales\|admin when lead_score ≥75.                                   |
|                                                                                                                                      |
| U.  Notification body includes: prospect name, business type, interested mall(s), lead score.                                        |
|                                                                                                                                      |
| V.  Clicking the notification deep-links to the lead detail page.                                                                    |
|                                                                                                                                      |
| W.  Notification delivered within 30 seconds of lead creation in Firestore.                                                          |
|                                                                                                                                      |
| X.  Notification permission request shown on first login; gracefully degraded if denied (email fallback).                            |
+--------------------------------------------------------------------------------------------------------------------------------------+

+--------------------------------------------------------------------------------------------------------------------------------------------------------+
| **US-012** As a sales representative, I want to update the status of a lead and log a contact attempt,                                                 |
|                                                                                                                                                        |
| *so that the team has an accurate view of pipeline progression.*                                                                                       |
|                                                                                                                                                        |
| **Acceptance Criteria:**                                                                                                                               |
|                                                                                                                                                        |
| Y.  Status transitions allowed: new → contacted → site_visit_scheduled → proposal_sent → closed_won \| closed_lost.                                    |
|                                                                                                                                                        |
| Z.  Each status change is written to leads/{leadId}/activity_log as a subcollection document with: agent_uid, timestamp, from_status, to_status, note. |
|                                                                                                                                                        |
| A.  Status dropdown is disabled for leads owned by another sales rep unless the agent has role: admin.                                                 |
|                                                                                                                                                        |
| B.  Closed leads cannot be re-opened without admin override.                                                                                           |
+--------------------------------------------------------------------------------------------------------------------------------------------------------+

**Epic 3 --- Admin & Knowledge Base Management**

+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **US-013** As a admin, I want to upload a new or updated sales kit PDF and have it automatically indexed into the knowledge base,                                                               |
|                                                                                                                                                                                                 |
| *so that the chatbot immediately reflects current leasing offerings without a manual code deployment.*                                                                                          |
|                                                                                                                                                                                                 |
| **Acceptance Criteria:**                                                                                                                                                                        |
|                                                                                                                                                                                                 |
| C.  Admin uploads PDF via the Admin panel (max 20 MB, PDF only).                                                                                                                                |
|                                                                                                                                                                                                 |
| D.  File stored in Firebase Storage at kb-docs/{category}/{filename}.                                                                                                                           |
|                                                                                                                                                                                                 |
| E.  Upload triggers POST /api/v1/admin/ingest which: extracts text (PyPDF2), splits into 512-token chunks with 50-token overlap, generates embeddings, upserts to Pinecone namespace=sales-kit. |
|                                                                                                                                                                                                 |
| F.  Ingestion status shown in UI: queued → processing → indexed (with chunk count).                                                                                                             |
|                                                                                                                                                                                                 |
| G.  Ingestion completes within 120 seconds for a 20-page document.                                                                                                                              |
|                                                                                                                                                                                                 |
| H.  On failure, admin receives error notification and the previous index version remains active.                                                                                                |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

+------------------------------------------------------------------------------------------------------------------------------+
| **US-014** As a admin, I want to mark a unit as unavailable (leased or under renovation) from the admin panel,               |
|                                                                                                                              |
| *so that the chatbot stops recommending it to prospects immediately.*                                                        |
|                                                                                                                              |
| **Acceptance Criteria:**                                                                                                     |
|                                                                                                                              |
| I.  Admin updates units/{unitId}.status from available to leased\|renovation\|reserved.                                      |
|                                                                                                                              |
| J.  Firestore write propagates to the API in real time; subsequent chatbot recommendations exclude the unit within 1 minute. |
|                                                                                                                              |
| K.  Status change logged in units/{unitId}/audit_log with: changed_by_uid, timestamp, from_status, to_status.                |
|                                                                                                                              |
| L.  Bulk update supported: admin can upload a CSV of unit codes and statuses.                                                |
+------------------------------------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **US-015** As a admin, I want to view a dashboard of chatbot usage, lead conversion rates, and knowledge base coverage gaps,                                                                             |
|                                                                                                                                                                                                          |
| *so that I can improve the system's accuracy over time.*                                                                                                                                                 |
|                                                                                                                                                                                                          |
| **Acceptance Criteria:**                                                                                                                                                                                 |
|                                                                                                                                                                                                          |
| M.  Dashboard displays: total conversations (daily/weekly/monthly), leads captured, lead conversion rate (leads / conversations), average lead score, top-5 queried business types, top-5 queried malls. |
|                                                                                                                                                                                                          |
| N.  Knowledge gap report: conversations where the bot responded with a fallback are listed with the user's original query, enabling admin to identify missing content.                                   |
|                                                                                                                                                                                                          |
| O.  All metrics derived from Firestore in real time; no separate analytics database in pilot.                                                                                                            |
|                                                                                                                                                                                                          |
| P.  Export dashboard data as CSV.                                                                                                                                                                        |
+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

**6. Firestore Data Model**

All collections use auto-generated Firestore document IDs unless noted. Timestamps are Firestore Timestamp type. Monetary values are stored as integers in THB (no decimals).

**6.1 malls**

One document per CPN mall property.

// Collection: malls / {mallId}

{

\"mall_id\": \"CW001\", // Short code, also document ID

\"name_en\": \"CentralWorld\",

\"name_th\": \"เซ็นทรัลเวิลด์\",

\"location\": {

\"province\": \"Bangkok\",

\"district\": \"Pathum Wan\",

\"address_en\": \"999/9 Rama I Rd, Pathum Wan, Bangkok 10330\",

\"lat\": 13.7467,

\"lng\": 100.5393

},

\"type\": \"super_regional\", // super_regional \| regional \| community

\"total_gla_sqm\": 550000,

\"floors_retail\": 7,

\"floors_basement\": 2,

\"parking_spaces\": 4000,

\"anchor_tenants\": \[\"Isetan\", \"ZEN\", \"Tops\", \"SF Cinema\"\],

\"zones\": \[\"Fashion\",\"Food & Beverage\",\"Entertainment\",\"Services\",\"Beauty\"\],

\"operating_hours\": \"10:00--22:00\",

\"active\": true

}

**6.2 units**

One document per leasable unit. Each unit belongs to one mall.

// Collection: units / {unitId}

{

\"unit_id\": \"CW-B1-042\", // {mallCode}-{floor}-{unitNumber}

\"mall_id\": \"CW001\",

\"floor\": \"B1\",

\"zone\": \"Food & Beverage\",

\"unit_code\": \"B1-042\",

\"size_sqm\": 45,

\"shape\": \"regular\", // regular \| corner \| L-shape \| kiosk

\"frontage_m\": 6.5,

\"base_rent_thb_sqm\": 3200, // THB per sqm per month

\"service_charge_thb_sqm\": 480, // CAM charge

\"total_rent_thb_month\": 167400, // (base + service) \* size

\"min_lease_months\": 12,

\"standard_lease_months\": 36,

\"deposit_months\": 3,

\"status\": \"available\", // available \| leased \| reserved \| renovation

\"available_from\": \"2026-04-01\",

\"compatible_categories\": \[\"restaurant\",\"cafe\",\"dessert\",\"quick_service\"\],

\"fit_out_condition\": \"shell\", // shell \| fitted \| warm_shell

\"notes\": \"Corner unit, high foot traffic near escalator\",

\"updated_at\": Timestamp

}

**6.3 price_tiers**

Reference collection defining rent ranges by mall type, zone, and unit size band. Used for lead budget qualification.

// Collection: price_tiers / {tierId}

{

\"mall_type\": \"super_regional\",

\"zone\": \"Food & Beverage\",

\"size_band\": \"small\", // small (\<50sqm) \| medium (50-200) \| large (\>200)

\"base_rent_min\": 2800, // THB/sqm/month

\"base_rent_max\": 4500,

\"service_charge_pct\": 0.15 // % of base rent

}

**6.4 lease_terms**

Standard lease terms and required documents. Single document per term type; referenced by the RAG pipeline.

// Collection: lease_terms / {termId}

{

\"term_id\": \"standard_retail_th\",

\"lease_type\": \"standard\",

\"min_term_months\": 12,

\"standard_term_months\": 36,

\"max_term_months\": 60,

\"deposit_months\": 3,

\"advance_rent_months\": 1,

\"fit_out_period_days\": 45, // Rent-free fit-out period

\"fit_out_guidelines_url\": \"gs://cpn-kb/terms/fitout_guidelines_2026.pdf\",

\"required_documents\": {

\"individual\": \[\"National ID copy\",\"Bank statement 6 months\",\"Business plan\"\],

\"company\": \[\"DBD registration\",\"Director ID\",\"Bank statement 6 months\",

\"Shareholder list\",\"Audited financials 2 years\",\"Business plan\"\]

},

\"revenue_sharing_applicable\": false,

\"pdpa_consent_required\": true,

\"effective_date\": \"2026-01-01\"

}

**6.5 merchant_categories**

Master category taxonomy for merchant type classification. Used for unit compatibility matching.

// Collection: merchant_categories / {categoryId}

{

\"category_id\": \"fashion_womenswear\",

\"label_en\": \"Women\'s Fashion\",

\"label_th\": \"แฟชั่นสตรี\",

\"parent_category\": \"fashion\",

\"compatible_zones\": \[\"Fashion\",\"Lifestyle\"\],

\"size_range_sqm\": { \"min\": 30, \"max\": 500 },

\"anchor_preference\": false

}

**6.6 conversations**

One document per chatbot session. Messages stored as a subcollection.

// Collection: conversations / {sessionId}

{

\"session_id\": \"anon_xK92mP\...\", // Firebase anonymous UID

\"status\": \"active\", // active \| expired \| converted

\"language\": \"th\", // detected: th \| en

\"lead_id\": null, // Populated when lead is created

\"started_at\": Timestamp,

\"last_active_at\": Timestamp,

\"turn_count\": 0

}

// Subcollection: conversations/{sessionId}/messages / {messageId}

{

\"role\": \"user\", // user \| assistant

\"content\": \"สวัสดีครับ ผมอยากเช่าพื้นที่ขายกาแฟ\",

\"context_chunks\": \[\"chunk_id_1\",\"chunk_id_2\"\], // Pinecone IDs used

\"timestamp\": Timestamp

}

**6.7 leads**

One document per captured prospect. Activity log as subcollection.

// Collection: leads / {leadId}

{

\"lead_id\": \"lead_Pz9kR\...\",

\"session_id\": \"anon_xK92mP\...\",

\"name\": \"คุณสมชาย ใจดี\",

\"phone\": \"+66812345678\",

\"email\": \"somchai@example.com\",

\"business_type\": \"cafe\",

\"merchant_category\": \"coffee_specialty\",

\"preferred_malls\": \[\"CW001\",\"CLD001\"\],

\"size_requirement_sqm\": { \"min\": 30, \"max\": 80 },

\"budget_thb_month\": 150000,

\"interested_units\": \[\"CW-B1-042\",\"CLD-G-018\"\],

\"lead_score\": 82,

\"status\": \"new\",

\"assigned_to_uid\": null,

\"ai_summary\": \"Prospect seeking a 30-80 sqm coffee specialty space\...\",

\"created_at\": Timestamp,

\"updated_at\": Timestamp

}

// Subcollection: leads/{leadId}/activity_log / {logId}

{

\"agent_uid\": \"uid_abc123\",

\"from_status\": \"new\",

\"to_status\": \"contacted\",

\"note\": \"Called, will visit CentralWorld on Apr 5\",

\"timestamp\": Timestamp

}

**6.8 users**

Internal staff accounts. Created on first Google SSO login.

// Collection: users / {uid}

{

\"uid\": \"uid_abc123\", // Firebase UID

\"email\": \"agent@centralpattana.co.th\",

\"display_name\": \"Somying Chotiwong\",

\"role\": \"agent\", // agent \| sales \| admin

\"assigned_malls\": \[\"CW001\",\"CLD001\"\], // Scope for agents

\"fcm_token\": \"fcm_xyz\...\",

\"created_at\": Timestamp,

\"last_login\": Timestamp

}

**7. API Endpoint Reference**

All endpoints are prefixed /api/v1. Protected endpoints require a Firebase ID token in the Authorization: Bearer {token} header. Role enforcement is noted per endpoint.

  ------------ --------------------------- ------------------------- ------------------------------------------------------------------------------------------------
  **Method**   **Path**                    **Auth**                  **Description**

  **POST**     /chat/{sessionId}/message   Anonymous                 Send a message. Returns SSE stream. Body: {content: string}

  **GET**      /chat/{sessionId}/history   Anonymous (own session)   Retrieve last N messages for session. Query: limit=20

  **POST**     /leads                      Anonymous                 Capture lead from chatbot. Body: LeadCreate schema.

  **POST**     /recommend                  Agent+                    Unit recommendations. Body: {business_type, mall_ids?, size_min, size_max, budget_thb}

  **GET**      /leads                      Agent+                    List leads. Query: status, score_min, mall_id, page, limit. Returns paginated LeadSummary\[\].

  **GET**      /leads/{leadId}             Agent+                    Full lead detail including AI summary and transcript.

  **PATCH**    /leads/{leadId}             Agent+                    Update lead status/assignment. Body: {status?, assigned_to_uid?, note?}

  **GET**      /units                      Agent+                    Query available units. Filters: mall_id, zone, size_min, size_max, status.

  **POST**     /admin/ingest               Admin                     Upload PDF to Firebase Storage and trigger RAG indexing pipeline. Multipart form.

  **GET**      /admin/ingest/status        Admin                     Check indexing job status. Returns {status, chunks_indexed, error?}

  **PATCH**    /admin/units/{unitId}       Admin                     Update unit status or pricing.

  **POST**     /admin/units/bulk           Admin                     Bulk update units from CSV upload.

  **GET**      /admin/analytics            Admin                     Usage metrics: conversations, leads, conversion rate, top queries.
  ------------ --------------------------- ------------------------- ------------------------------------------------------------------------------------------------

**8. Mock Data Specification**

The following mock data set enables full end-to-end system operation before CPN provides access to internal systems. All data is derived from publicly available sources: CPN's investor relations publications, annual reports, CPN website mall directory, and Bangkok commercial real estate market reports (CBRE, JLL, Colliers Thailand).

Generation approach: a Python script (scripts/generate_mock_data.py) populates Firestore and Pinecone with the structures defined below. The script is idempotent and tagged with source: MOCK so records can be bulk-deleted before production data is loaded.

**8.1 Mall Directory --- 7 Properties**

Source: CPN Annual Report 2024, CPN website (www.cpn.co.th/en/properties), CBRE Thailand Retail MarketView Q4 2025.

  ------------- ----------------------------- --------------------------- ----------------- --------------- ------------ -------------
  **Mall ID**   **Name**                      **District/Province**       **Type**          **GLA (sqm)**   **Floors**   **Parking**

  **CW001**     CentralWorld                  Pathum Wan, Bangkok         Super Regional    550,000         B2--7F       4,000

  **CLD001**    Central Ladprao               Chatuchak, Bangkok          Super Regional    215,000         B1--6F       2,800

  **CR9001**    Central Rama 9                Huai Khwang, Bangkok        Regional          130,000         B1--5F       2,000

  **CEM001**    Central Embassy               Ploenchit, Bangkok          Luxury Regional   54,000          B1--6F       600

  **CPA001**    Central Pattaya               Pattaya, Chonburi           Regional          82,000          B1--4F       1,500

  **CCNX001**   Central Chiangmai Xperience   Mueang, Chiang Mai          Regional          80,000          B1--5F       1,200

  **CK001**     Central Korat                 Mueang, Nakhon Ratchasima   Regional          100,000         B1--5F       1,800
  ------------- ----------------------------- --------------------------- ----------------- --------------- ------------ -------------

**8.2 Rental Pricing Tiers --- Indicative Rates**

Source: CBRE Thailand Retail MarketView Q4 2025, JLL Thailand Retail Report 2025, Colliers International Bangkok Retail Report Q3 2025. Rates are indicative and publicly reported ranges; exact CPN rates are subject to negotiation.

  ------------------------------- ------------------ -------------------- -------------------------------- -------------------------------- --------------------
  **Mall Type**                   **Zone**           **Size Band**        **Base Rent Min (THB/sqm/mo)**   **Base Rent Max (THB/sqm/mo)**   **Service Charge**

  **Super Regional (Bangkok)**    Fashion            Small (\<50sqm)      2,800                            5,000                            15%

  **Super Regional (Bangkok)**    Food & Beverage    Small (\<50sqm)      3,200                            5,500                            15%

  **Super Regional (Bangkok)**    Fashion            Medium (50-200sqm)   2,000                            3,800                            15%

  **Super Regional (Bangkok)**    Entertainment      Large (\>200sqm)     800                              1,800                            12%

  **Luxury Regional (Bangkok)**   Fashion / Luxury   Small (\<50sqm)      5,000                            9,000                            15%

  **Regional (Bangkok)**          Fashion            Small (\<50sqm)      1,500                            3,000                            15%

  **Regional (Bangkok)**          Food & Beverage    Small (\<50sqm)      1,800                            3,500                            15%

  **Regional (Provincial)**       Fashion            Small (\<50sqm)      800                              2,000                            12%

  **Regional (Provincial)**       Food & Beverage    Small (\<50sqm)      1,000                            2,200                            12%
  ------------------------------- ------------------ -------------------- -------------------------------- -------------------------------- --------------------

**8.3 Unit Records --- Volume & Generation Rules**

Generate 30 units per mall (210 total). Distribution per mall:

-   40% Small units (15--60 sqm): kiosks, small boutiques, cafes

-   40% Medium units (60--250 sqm): restaurants, fashion retail, services

-   15% Large units (250--800 sqm): anchor-lite tenants, gyms, entertainment

-   5% Kiosk carts (5--15 sqm): THB 50,000--120,000/month flat rate

**Status distribution (mock):** 70% available, 20% leased, 7% reserved, 3% renovation.

**Available_from dates:** Units with status=available have available_from between today and today + 90 days.

**Unit codes:** Format {mallCode}-{floorCode}-{3-digit seq}, e.g. CW-B1-042, CW-G-001, CW-3F-015.

**Floors:** B2, B1, G, 1F, 2F, 3F, 4F, 5F, 6F (not all floors for all malls).

**8.4 Merchant Category Taxonomy**

Generate 40 leaf categories under 8 parent categories, matching CPN's publicly listed tenant mix on their website:

  --------------------------- --------------------------------------------------------------------------------------------------------------------------------------------
  **Parent Category**         **Leaf Categories**

  **Fashion**                 Womens Apparel, Menswear, Kids Fashion, Sports & Outdoor, Accessories, Footwear, Luxury Fashion, Streetwear

  **Food & Beverage**         Thai Cuisine, International Cuisine, Japanese, Korean, Fast Food, Coffee Specialty, Bubble Tea, Dessert & Bakery, Health Food, Fine Dining

  **Beauty & Health**         Cosmetics & Skincare, Nail & Spa, Hair Salon, Pharmacy, Optical, Wellness

  **Electronics & IT**        Smartphones & Accessories, Computers & Peripherals, Smart Home, Photography

  **Entertainment**           Cinema, Bowling & Games, Family Entertainment Center, Escape Room, Karaoke

  **Home & Lifestyle**        Home Decor, Furniture, Kitchenware, Books & Stationery, Gifts & Toys

  **Services**                Bank & Financial, Travel Agency, Mobile Network, Laundry, Alterations

  **Supermarket & Grocery**   Hypermarket, Supermarket, Specialty Grocery, Organic Food
  --------------------------- --------------------------------------------------------------------------------------------------------------------------------------------

**8.5 Lease Terms Document (Plaintext for RAG Indexing)**

Generate one lease_terms_standard.txt file to be uploaded to Firebase Storage and indexed into Pinecone (namespace=terms). Content derived from publicly available Thai commercial lease frameworks and CPN's leasing FAQ page. Key sections:

-   Section 1 --- Lease Duration: Minimum 1 year. Standard term 3 years. Maximum 5 years. Renewal at landlord's discretion subject to performance review.

-   Section 2 --- Financial Terms: Security deposit 3 months base rent + 1 month advance rent payable on signing. Service charge (CAM) 12--15% of base rent depending on mall tier. Subject to annual CPI adjustment (max 5% YoY).

-   Section 3 --- Fit-Out: Tenant receives 30--60 days rent-free fit-out period (shell units). Fit-out must comply with CPN's Design & Construction Guidelines. Pre-approved contractor list required.

-   Section 4 --- Required Documents: Individual --- National ID, 6-month bank statement, business plan. Company --- DBD certificate, director ID, 6-month bank statement, 2-year audited financials, shareholder list.

-   Section 5 --- Termination: Early termination penalty 3 months base rent plus forfeiture of deposit. 90-day advance notice required.

-   Section 6 --- PDPA: Tenant data collected for leasing purposes only. Consent form mandatory at signing. Data retained 7 years post-lease expiry.

**8.6 Sales Kit Mock Documents**

Generate two PDF files (using ReportLab) for RAG indexing (namespace=sales-kit):

-   cpn_leasing_overview_2026.pdf (8 pages): CPN company overview, portfolio map, leasing value proposition (foot traffic data, loyalty member stats), tenant support services.

-   cpn_leasing_process_2026.pdf (5 pages): Step-by-step leasing application process, timeline from inquiry to key handover (\~45--90 days), contact directory by mall, FAQ.

**8.7 Test Conversation Fixtures**

Generate 20 synthetic conversation transcripts covering the following scenarios for use in integration and E2E tests:

-   Happy path Thai: Tenant inquires in Thai, receives unit recommendations, provides contact → lead created.

-   Happy path English: Same flow in English.

-   No match: Tenant requests unit in a mall where no units match their criteria → bot offers alternatives.

-   Budget mismatch: Tenant's stated budget is below market rate → bot explains pricing range diplomatically.

-   Document query: Tenant asks about required documents → bot answers from lease_terms RAG context.

-   Out-of-scope query: Tenant asks about stock prices → bot redirects to leasing topics.

-   Duplicate lead: Same phone number submits contact twice → system deduplicates.

-   Ambiguous business type: Tenant says 'ขายอาหาร' (sell food) → bot asks clarifying question about cuisine type.

**9. Non-Functional Requirements**

  ------------------ --------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------
  **Category**       **Requirement**                   **Measurement / Target**

  **Performance**    Chatbot response latency          P95 ≤10 seconds (first token); ≤30 seconds (complete response) under 20 concurrent users

  **Performance**    Recommendation API                P95 ≤10 seconds

  **Availability**   Pilot SLA                         99% uptime during Bangkok business hours (08:00--22:00 ICT). Firebase and Cloud Run SLAs underpin this.

  **Accuracy**       Unit recommendation correctness   0% hallucinated unit data (all unit IDs in responses must exist in Firestore). Verified in test suite US-002.

  **Accuracy**       Knowledge base coverage           Bot correctly answers ≥90% of predefined test queries from the fixture set (Section 8.7).

  **Security**       Authentication                    All /admin/\* and internal endpoints verify Firebase ID token and role claim server-side. Anonymous sessions limited to chatbot endpoints only.

  **Security**       Data isolation                    Firestore security rules prevent guests from reading leads, users, or admin collections. Agent role cannot read other agents' private notes.

  **PDPA**           Consent                           Chatbot displays consent banner before collecting name/contact. Consent timestamp stored in lead document.

  **PDPA**           Data retention                    Anonymous conversations without lead conversion purged after 30 days via Cloud Scheduler.

  **Scalability**    Pilot load                        Support up to 50 concurrent chatbot users and 10 concurrent internal users. Cloud Run auto-scales; Pinecone Serverless scales automatically.
  ------------------ --------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------

**10. Testing Strategy**

Each acceptance criterion in Section 5 maps directly to a test case. The following levels are planned for the pilot:

**10.1 Unit Tests (pytest)**

-   RAG pipeline: embed → retrieve → generate with mocked Pinecone and OpenAI responses.

-   Lead scoring engine: input vectors → expected score ranges for 10 pre-defined merchant profiles.

-   Firestore deduplication logic: same phone number within/outside 30-day window.

-   Auth middleware: valid token → pass; expired token → 401; wrong role → 403.

**10.2 Integration Tests (pytest + Firestore emulator)**

-   POST /chat/{sessionId}/message: verify SSE stream, Firestore conversation write, context chunk IDs recorded.

-   POST /leads: verify lead document creation, FCM trigger mock called, duplicate detection.

-   POST /recommend: verify unit query filters (status=available, size range, budget), ranking order.

-   POST /admin/ingest: verify Storage upload, chunking, Pinecone upsert call count.

**10.3 E2E Tests (Playwright)**

-   US-001: Anonymous session creation and first message flow (Thai + English).

-   US-003: Unit recommendation scenario using test conversation fixture.

-   US-005: Lead capture form → Firestore lead document → FCM notification verification.

-   US-007: Google SSO login redirect for internal user.

-   US-008: Lead list real-time update when new lead created in parallel browser session.

**10.4 Acceptance Test (PoC Demo Criteria)**

The following criteria constitute the milestone sign-off for Phase 1 payment:

15. 20 pre-defined test queries (Thai and English) achieve correct unit recommendation or on-topic response as judged by the CPN leasing team representative.

16. Lead capture flow demonstrated end-to-end: prospect submits contact → lead appears in internal dashboard within 30 seconds.

17. Internal assistant recommends at least 3 matching units for each of 5 test merchant profiles provided by CPN.

18. System sustains 10 concurrent chatbot sessions without error during the demo.

19. Zero hallucinated unit data in any test response.
