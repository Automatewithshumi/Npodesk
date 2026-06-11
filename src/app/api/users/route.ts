export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Missing Supabase environment variables');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, full_name, password, role, org_id, requester_id } = body;

    // Validate inputs
    if (!email || !full_name || !password || !role || !org_id || !requester_id) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Verify requester exists and is admin/super_admin
    const { data: requester, error: reqError } = await admin
      .from('users')
      .select('role, org_id')
      .eq('id', requester_id)
      .single();

    if (reqError || !requester) {
      return NextResponse.json({ error: 'Could not verify your permissions' }, { status: 403 });
    }

    if (!['super_admin', 'admin'].includes(requester.role)) {
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm so they can login immediately
      user_metadata: { full_name }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = authData.user.id;

    // Step 2: Check if a users table row already exists for this ID
    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('id', newUserId)
      .single();

    if (existing) {
      // Update existing row
      await admin.from('users').update({
        org_id,
        full_name,
        role,
      }).eq('id', newUserId);
    } else {
      // Insert new row
      const { error: profileError } = await admin.from('users').insert({
        id: newUserId,
        org_id,
        full_name,
        role,
      });

      if (profileError) {
        // Rollback auth user
        await admin.auth.admin.deleteUser(newUserId);
        return NextResponse.json({ error: `Profile error: ${profileError.message}` }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      userId: newUserId,
      message: `${full_name} created successfully`
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Create user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { user_id, requester_id } = await req.json();

    if (!user_id || !requester_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Verify requester
    const { data: requester } = await admin
      .from('users')
      .select('role')
      .eq('id', requester_id)
      .single();

    if (!requester || !['super_admin', 'admin'].includes(requester.role)) {
      return NextResponse.json({ error: 'Only admins can remove users' }, { status: 403 });
    }

    // Delete profile first
    await admin.from('users').delete().eq('id', user_id);

    // Delete auth user
    const { error: deleteError } = await admin.auth.admin.deleteUser(user_id);
    if (deleteError) {
      console.error('Auth delete error:', deleteError);
      // Profile already deleted — still return success
    }

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to fix existing users with wrong/missing org_id
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const org_id = url.searchParams.get('org_id');
    const requester_id = url.searchParams.get('requester_id');

    if (!org_id || !requester_id) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const admin = getAdminClient();

    // Verify requester
    const { data: requester } = await admin
      .from('users')
      .select('role')
      .eq('id', requester_id)
      .single();

    if (!requester || !['super_admin', 'admin'].includes(requester.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all users for this org
    const { data: users, error } = await admin
      .from('users')
      .select('*')
      .eq('org_id', org_id);

    return NextResponse.json({ users, error });

  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
