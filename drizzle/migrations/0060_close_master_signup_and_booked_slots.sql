REVOKE EXECUTE ON FUNCTION public.booked_slots(uuid, date) FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
 INSERT INTO public.profiles(id,full_name,email) VALUES(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''),new.email);
 INSERT INTO public.user_roles(user_id,role) VALUES(new.id,'dono_salao') ON CONFLICT DO NOTHING;
 -- Master role is never granted at signup; it is provisioned only in protected user_roles.
 IF new.email_confirmed_at IS NOT NULL THEN PERFORM public.claim_verified_purchase(new.id,new.email,new.raw_user_meta_data); END IF;
 RETURN new;
END $function$;