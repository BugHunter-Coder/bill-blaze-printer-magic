-- Create roles table for custom shop roles
create table if not exists roles (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade,
  name text not null,
  permissions text[] not null default '{}',
  created_at timestamp with time zone default now()
);

-- Create user_roles table to assign users to roles
create table if not exists user_roles (
  user_id uuid references profiles(id) on delete cascade,
  role_id uuid references roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- Add index for faster lookups
create index if not exists idx_roles_shop_id on roles(shop_id);
create index if not exists idx_user_roles_user_id on user_roles(user_id);
create index if not exists idx_user_roles_role_id on user_roles(role_id); 