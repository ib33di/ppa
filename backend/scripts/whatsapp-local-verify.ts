import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { WhatsAppService } from '../src/whatsapp/whatsapp.service';
import { WebhooksService } from '../src/webhooks/webhooks.service';
import { InvitationsService } from '../src/invitations/invitations.service';
import { SupabaseService } from '../src/supabase/supabase.service';

function getFlag(name: string): boolean {
  return process.argv.includes(name);
}

function getArgValue(prefix: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (!hit) return undefined;
  const [, value] = hit.split('=');
  return value;
}

function normalizePhoneForUltraMsg(phone: string): string {
  // UltraMsg commonly expects / emits phone numbers without '+'.
  return phone.replace(/^\+/, '').replace(/\s/g, '').replace(/-/g, '');
}

async function main() {
  const invitationId = getArgValue('--invitationId=') || process.argv[2];
  const shouldSend = getFlag('--send');

  if (!invitationId) {
    console.error(
      [
        'Usage:',
        '  npx ts-node scripts/whatsapp-local-verify.ts --invitationId=<INVITATION_UUID> [--send]',
        '',
        'Notes:',
        '- --send will call UltraMsg API to send the invitation (requires valid ULTRAMSG_* env).',
        '- Without --send, the script only simulates webhook payloads + verifies DB status updates.',
      ].join('\n'),
    );
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const whatsapp = app.get(WhatsAppService);
    const webhooks = app.get(WebhooksService);
    const invitations = app.get(InvitationsService);
    const supabase = app.get(SupabaseService);

    const invitation = await invitations.findOne(invitationId);
    if (!invitation?.player?.phone) {
      throw new Error(`Invitation ${invitationId} not found or missing player.phone`);
    }

    const from = normalizePhoneForUltraMsg(invitation.player.phone);
    console.log('[LocalVerify] Using invitation:', {
      invitationId,
      playerName: invitation.player?.name,
      playerPhone: invitation.player?.phone,
      ultraMsgFrom: from,
      currentStatus: invitation.status,
    });

    if (shouldSend) {
      console.log('[LocalVerify] Sending invitation via UltraMsg...');
      const sendResult = await whatsapp.sendInvitation(invitationId);
      console.log('[LocalVerify] Send result:', sendResult);
    }

    async function resetInvitation() {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'invited', responded_at: null })
        .eq('id', invitationId);
      if (error) throw error;
    }

    async function assertStatus(expected: string) {
      const latest = await invitations.findOne(invitationId);
      const actual = latest?.status;
      console.log('[LocalVerify] Invitation status:', { expected, actual });
      if (actual !== expected) {
        throw new Error(`Expected invitation.status=${expected} but got ${actual}`);
      }
    }

    async function runCase(name: string, payload: any, expectedStatus: 'confirmed' | 'declined') {
      console.log(`\n[LocalVerify] Case: ${name}`);
      await resetInvitation();
      await assertStatus('invited');
      const result = await webhooks.handleWhatsAppWebhook(payload);
      console.log('[LocalVerify] Webhook result:', result);
      await assertStatus(expectedStatus);
    }

    // a) text YES
    await runCase('text YES', { from, body: 'YES', type: 'chat' }, 'confirmed');

    // b) button CONFIRM_YES
    await runCase('button CONFIRM_YES', { from, button_id: 'CONFIRM_YES', body: '', type: 'button' }, 'confirmed');

    // c) button CONFIRM_NO
    await runCase('button CONFIRM_NO', { from, button_id: 'CONFIRM_NO', body: '', type: 'button' }, 'declined');

    console.log('\n[LocalVerify] All cases passed.');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('[LocalVerify] Failed:', err);
  process.exit(1);
});

