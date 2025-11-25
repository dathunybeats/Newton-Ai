-- Create a function to get user details (email, name, avatar) by user ID
CREATE OR REPLACE FUNCTION public.get_user_details(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(p.full_name, split_part(u.email, '@', 1)) as full_name,
    p.avatar_url
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_details(uuid[]) TO authenticated;
