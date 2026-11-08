LeadFlow-AI

A lightweight, cloud-connected CRM application designed to help individuals and small teams organize leads, track sales opportunities, and manage follow-ups.

Features

* Create, edit, and delete leads
* Manage sales pipeline stages
* Track lead sources
* Track potential deal values (USD)
* Schedule and complete follow-ups
* Supabase authentication
* Cloud data storage
* User-specific data access with Row Level Security (RLS)
* Responsive interface
* Light and dark themes

Project Files

* index.html — Application structure
* styles.css — Application styling
* app.js — Application logic
* config.example.js — Example Supabase configuration
* supabase-schema.sql — Initial database setup for new projects
* supabase-migration-v1.2.sql — Compatibility migration for older LeadFlow-AI databases

Requirements

* A modern web browser
* A Supabase account and project
* A static web hosting service

Setup Instructions

1. Create a Supabase Project

Create your own project at https://supabase.com.

2. Configure the Database

For a brand-new installation:

1. Open your Supabase project’s SQL Editor.
2. Open supabase-schema.sql.
3. Copy its contents into the SQL Editor.
4. Run the SQL script.

Important: Do not run supabase-migration-v1.2.sql for a brand-new installation. That file is intended only for upgrading older LeadFlow-AI databases.

3. Configure Supabase

1. Open config.example.js.
2. Replace the placeholder values with your own Supabase Project URL and Publishable Key.
3. Save a copy named config.js.

Do not use your Supabase Service Role key in browser-side files.

4. Configure Authentication

In Supabase Authentication settings, configure the Site URL and Redirect URLs to match your deployed application domain.

5. Deploy the Application

Upload the required application files to your preferred static hosting provider.

Make sure these files are available at the application root:

* index.html
* styles.css
* app.js
* config.js

6. Test Your Installation

* Create a user account.
* Sign in to the application.
* Add and edit a lead.
* Test follow-up functionality.
* Refresh the application and confirm that data persists.

Security

LeadFlow-AI uses Supabase authentication and Row Level Security policies to isolate user data.

Use your own Supabase project when deploying your copy.

Never include Supabase Service Role keys or other secret credentials in browser-side files.

Customization

You can customize the branding, styling, lead fields, and application behavior to fit your needs.

License

License and redistribution terms are determined by the product seller.
