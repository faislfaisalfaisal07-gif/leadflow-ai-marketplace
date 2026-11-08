LeadFlow-AI

A lightweight, cloud-connected CRM application for managing leads, sales opportunities, and follow-ups.

Features

* Create, edit, and delete leads
* Sales pipeline management
* Lead source tracking
* Deal value tracking (USD)
* Follow-up scheduling and completion
* Supabase authentication
* Cloud data storage
* Row Level Security (RLS)
* Responsive interface
* Light and dark themes

Project Files

* index.html — Application structure
* styles.css — Application styling
* app.js — Application logic
* config.example.js — Example Supabase configuration
* supabase-schema.sql — Initial database setup
* supabase-migration-v1.2.sql — Compatibility migration for older installations

Requirements

* A modern web browser
* A Supabase account
* A static web hosting service

Installation

1. Create a Supabase project

Create a project at https://supabase.com.

2. Set up the database

For a new installation:

1. Open Supabase SQL Editor.
2. Copy the contents of supabase-schema.sql.
3. Run the SQL script.

Do not run the migration file on a new installation. It is only for upgrading older versions.

3. Configure Supabase

1. Open config.example.js.
2. Add your Supabase Project URL and Publishable Key.
3. Save the configured copy as config.js.

Never use a Service Role key in browser-side code.

4. Configure authentication

Set the Supabase Site URL and Redirect URLs to your deployed application domain.

5. Deploy

Upload these files to your static hosting root:

* index.html
* styles.css
* app.js
* config.js

6. Test

Create an account, sign in, add a lead, edit it, and verify that data persists after refreshing the application.

Security

The application uses Supabase Authentication and Row Level Security to protect user-specific data.

Use your own Supabase project and credentials.

Never publish secret credentials.

Customization

Branding, styling, lead fields, and application behavior can be customized.

License

License and redistribution terms are determined by the product seller.
