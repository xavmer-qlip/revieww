import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveBusinessForApi } from '@/lib/active-business';

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await getActiveBusinessForApi(supabase, user.id, request.cookies.get('woopla_active_business')?.value);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check plan requirement
    if (business.plan_type !== 'growth' && business.plan_type !== 'pro') {
      return NextResponse.json({ error: 'Plan Growth ou Pro requis' }, { status: 403 });
    }

    // Check if user already has a group
    const { data: existingGroup } = await supabase
      .from('business_groups')
      .select('id')
      .eq('owner_user_id', user.id)
      .limit(1);

    if (existingGroup && existingGroup.length > 0) {
      return NextResponse.json({ error: 'Vous avez déjà un groupe' }, { status: 409 });
    }

    // Create group
    const { data: group, error: groupError } = await supabase
      .from('business_groups')
      .insert({ name: name.trim(), owner_user_id: user.id })
      .select('*')
      .single();

    if (groupError || !group) {
      console.error('Error creating group:', groupError);
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }

    // Assign all user's businesses to this group
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ group_id: group.id })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error assigning businesses to group:', updateError);
    }

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Group create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
