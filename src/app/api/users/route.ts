import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side admin client using service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { email, full_name, password, role, org_id, requester_id } = await req.json();

    // Verify the requester is a super_admin
    const { data: requester, error: reqError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', requester_id)
      .single();

    if (reqError || !requester || requester.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admins can create users' }, { status: 403 });
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Insert into users table
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      org_id,
      full_name,
      role,
    });

    if (profileError) {
      // Rollback: delete the auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (err) {
    console.error('Create user error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { user_id, requester_id } = await req.json();

    // Verify requester is super_admin
    const { data: requester } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', requester_id)
      .single();

    if (!requester || requester.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admins can remove users' }, { status: 403 });
    }

    // Delete from users table first
    await supabaseAdmin.from('users').delete().eq('id', user_id);
    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(user_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
