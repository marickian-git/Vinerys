import { escapeHtml as h } from './escape';

function layout({ title, intro, actionLabel, actionUrl, footer }) {
  const html = `<!DOCTYPE html>
<html lang="ro"><body style="margin:0;padding:0;background:#0d0608;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1a0810;border:1px solid #3a1420;border-radius:14px;padding:32px;">
        <tr><td style="color:#c44569;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Vinerys</td></tr>
        <tr><td style="padding-top:12px;color:#f5e6e8;font-family:Georgia,serif;font-size:26px;">${h(title)}</td></tr>
        <tr><td style="padding-top:16px;color:#cdb8bc;font-size:15px;line-height:1.6;">${h(intro)}</td></tr>
        <tr><td style="padding:28px 0;">
          <a href="${h(actionUrl)}" style="display:inline-block;background:#8b1a2e;color:#f5e6e8;text-decoration:none;padding:14px 26px;border-radius:9px;font-size:14px;letter-spacing:1px;">${h(actionLabel)}</a>
        </td></tr>
        <tr><td style="color:#8a7377;font-size:12px;line-height:1.6;">${h(footer)}<br><br>Dacă butonul nu funcționează, copiază linkul:<br><span style="color:#c44569;word-break:break-all;">${h(actionUrl)}</span></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const text = `${title}\n\n${intro}\n\n${actionLabel}: ${actionUrl}\n\n${footer}`;
  return { html, text };
}

export function resetPasswordEmail({ name, url }) {
  return {
    subject: 'Resetează parola Vinerys',
    ...layout({
      title: 'Resetează parola',
      intro: `Salut${name ? `, ${name}` : ''}! Am primit o cerere de resetare a parolei pentru contul tău Vinerys.`,
      actionLabel: 'Alege o parolă nouă',
      actionUrl: url,
      footer: 'Linkul expiră într-o oră și poate fi folosit o singură dată. Dacă nu tu ai cerut resetarea, ignoră acest email.',
    }),
  };
}

export function verifyEmailEmail({ name, url }) {
  return {
    subject: 'Confirmă adresa de email — Vinerys',
    ...layout({
      title: 'Confirmă emailul',
      intro: `Salut${name ? `, ${name}` : ''}! Confirmă adresa de email ca să îți poți recupera contul oricând.`,
      actionLabel: 'Confirmă adresa',
      actionUrl: url,
      footer: 'Linkul expiră în 24 de ore.',
    }),
  };
}
