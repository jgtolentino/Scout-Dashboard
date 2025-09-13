# Figma Make Prompts for Supabase Backend

## Basic CRM with Authentication

```
Create a CRM app with Supabase backend.

Add authentication with email/password and Google OAuth.

Create these tables:
- leads: name, email, phone, status (new/contacted/qualified/converted/lost), notes, created_at
- accounts: name, website, industry, owner_id (linked to auth.users), created_at
- contacts: first_name, last_name, email, phone, account_id, created_at

Add Row Level Security so users only see their own data.

Include a dashboard showing:
- Total leads by status
- Recent activities
- Conversion funnel
- Quick add forms for leads and contacts

Style with a modern, professional theme using shadcn/ui components.
```

## E-commerce Backend

```
Build an e-commerce backend with Supabase.

Tables needed:
- products: name, description, price, inventory_count, category, images[], is_active
- orders: user_id, status, total, shipping_address, created_at
- order_items: order_id, product_id, quantity, price_at_purchase
- cart_items: user_id, product_id, quantity

Add Supabase Storage for product images.

Create Edge Functions for:
- Calculate shipping
- Process payments (Stripe webhook)
- Send order confirmation emails

Include RLS policies for:
- Public can view active products
- Users can manage their own cart and orders
- Admins can manage all data

Add realtime subscriptions for inventory updates.
```

## Project Management System

```
Create a project management app with Supabase backend.

Authentication: Email + GitHub OAuth

Database schema:
- projects: name, description, status, start_date, end_date, owner_id
- tasks: title, description, project_id, assigned_to, status, priority, due_date
- comments: task_id, user_id, content, created_at
- attachments: task_id, file_url, uploaded_by

Storage buckets for:
- Project files
- Task attachments

Features:
- Kanban board view
- Real-time updates when tasks change
- File uploads with drag-and-drop
- User avatars from auth.users
- Activity feed using Postgres triggers

Add email notifications for task assignments.
```

## Event Booking Platform

```
Build an event booking platform with Supabase.

Tables:
- events: title, description, location, start_time, end_time, capacity, price, host_id
- bookings: event_id, user_id, quantity, total_paid, status, booking_code
- venues: name, address, capacity, amenities[]
- categories: name, slug, icon

Edge Functions:
- Generate unique booking codes
- Check event capacity before booking
- Send booking confirmation emails
- Handle payment webhooks

Features:
- Public event listing with filters
- User dashboard for managing bookings
- Host dashboard for managing events
- QR code generation for tickets
- Waitlist when events are full

Add Supabase Realtime for live capacity updates.
```

## Content Management System

```
Create a headless CMS with Supabase backend.

Schema:
- pages: slug, title, content, meta_description, published_at, author_id
- posts: title, slug, content, excerpt, featured_image, category_id, tags[], published_at
- media: filename, url, alt_text, mime_type, size, uploaded_by
- users: extend auth.users with role (admin/editor/author)

Features:
- Rich text editor for content
- Media library with Supabase Storage
- SEO metadata management
- Draft/Published states
- Revision history using audit tables
- Public API with rate limiting

Add these RLS policies:
- Public can read published content
- Authors can manage their own content
- Editors can manage all content
- Admins have full access

Include PostgreSQL full-text search.
```

## SaaS Starter Template

```
Build a SaaS starter with Supabase backend.

Multi-tenant architecture with:
- organizations: name, slug, owner_id, plan, trial_ends_at
- organization_members: org_id, user_id, role (owner/admin/member)
- invitations: org_id, email, role, invited_by, accepted_at

Subscription management:
- plans: name, price, features[]
- subscriptions: org_id, plan_id, status, current_period_end
- usage_tracking: org_id, feature, count, period

Features:
- Team management with invites
- Billing with Stripe integration
- Usage-based limits
- Audit logs for compliance
- API keys for external access

Add Edge Functions for:
- Stripe webhook handling
- Usage limit enforcement
- Invitation emails

Include comprehensive RLS for multi-tenancy.
```

## Deployment Commands

After generating your app in Figma Make:

```bash
# Initialize Supabase locally
supabase init

# Link to your project
supabase link --project-ref your-project-id

# Pull remote schema
supabase db pull

# Create migration from changes
supabase migration new figma_make_schema

# Test locally
supabase start

# Deploy to production
supabase db push
supabase functions deploy
```

## Tips for Figma Make + Supabase

1. **Always include in your prompt:**
   - Authentication method
   - Table relationships
   - RLS requirements
   - Real-time features needed

2. **For better results:**
   - Specify UI component library (shadcn/ui, MUI, etc.)
   - Include example data in your prompt
   - Mention specific Edge Functions needed
   - Request TypeScript types generation

3. **Post-generation steps:**
   - Review generated RLS policies
   - Add indexes for frequently queried columns
   - Set up environment variables
   - Configure CORS for your domain

4. **Production checklist:**
   - Enable RLS on all tables
   - Review and test all policies
   - Set up backup schedules
   - Configure custom domains
   - Enable monitoring and alerts