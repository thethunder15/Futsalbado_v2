import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Responder ao preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Verificar se quem chama é admin
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);

  // Checar se o usuário logado é admin na tabela public.users
  const { data: callerProfile, error: profileError } = await adminClient
    .from('users')
    .select('isAdmin')
    .eq('id', callerUser.id)
    .single();

  if (profileError || !callerProfile?.isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden: apenas admins podem redefinir senhas' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Ler body
  const { phone, newPassword } = await req.json();
  if (!phone || !newPassword) {
    return new Response(JSON.stringify({ error: 'phone e newPassword são obrigatórios' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (newPassword.length < 6) {
    return new Response(JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Montar o email fictício a partir dos dígitos do telefone
  const digits = phone.replace(/\D/g, '');
  const fakeEmail = `${digits}@futsalbado.com`;

  // Buscar o usuário no Auth pelo email
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    return new Response(JSON.stringify({ error: 'Falha ao buscar usuários' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const targetUser = users.find((u: any) => u.email === fakeEmail);
  if (!targetUser) {
    return new Response(JSON.stringify({ error: 'Usuário não encontrado para este telefone' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Redefinir a senha
  const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUser.id, {
    password: newPassword,
  });
  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, message: 'Senha redefinida com sucesso!' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
