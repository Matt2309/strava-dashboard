/**
 * Plain HTML template functions — no react-email. The app has zero email
 * dependencies today and only two templates (~40 lines of table-based HTML
 * each) that rarely change; react-email would add a second render pipeline
 * without removing the underlying table/inline-style markup email clients
 * still require.
 */

export type EmailContent = {
	subject: string;
	html: string;
	text: string;
};

type ShellParams = {
	preheader: string;
	heading: string;
	bodyParagraphs: string[];
	ctaLabel: string;
	ctaUrl: string;
	footerNote: string;
};

/**
 * Shared shell: 600px centred table, inline styles only (no <style> block —
 * many clients strip it), a bulletproof button (plain <a> with padding +
 * background, no VML — acceptable Outlook degradation), and the raw URL
 * printed below the button for clients that strip links entirely.
 */
function renderShell({
	preheader,
	heading,
	bodyParagraphs,
	ctaLabel,
	ctaUrl,
	footerNote,
}: ShellParams): string {
	const paragraphsHtml = bodyParagraphs
		.map(
			(p) =>
				`<p style="margin:0 0 16px 0;font-size:15px;line-height:1.5;color:#333333;">${p}</p>`,
		)
		.join("\n");

	return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<span style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:32px 16px;">
<tr>
<td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
<tr>
<td style="padding:32px 32px 8px 32px;">
<span style="font-weight:900;letter-spacing:-0.05em;text-transform:uppercase;font-size:18px;color:#111111;">Dromos Studio</span>
</td>
</tr>
<tr>
<td style="padding:16px 32px 24px 32px;">
<h1 style="margin:0 0 16px 0;font-size:20px;color:#111111;">${heading}</h1>
${paragraphsHtml}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr>
<td style="border-radius:6px;background-color:#111111;">
<a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${ctaLabel}</a>
</td>
</tr>
</table>
<p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#666666;">Se il bottone non funziona, copia e incolla questo link nel browser:</p>
<p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${ctaUrl}" style="color:#111111;">${ctaUrl}</a></p>
</td>
</tr>
<tr>
<td style="padding:24px 32px 32px 32px;border-top:1px solid #eeeeee;">
<p style="margin:0;font-size:12px;line-height:1.5;color:#999999;">${footerNote}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export function renderVerifyEmail(params: {
	name: string;
	url: string;
	expiresInMinutes: number;
}): EmailContent {
	const { name, url, expiresInMinutes } = params;
	const hours = Math.round(expiresInMinutes / 60);

	const html = renderShell({
		preheader: "Conferma il tuo indirizzo email per continuare su Dromos.",
		heading: `Ciao ${name}, conferma la tua email`,
		bodyParagraphs: [
			"Grazie per esserti registrato su Dromos Studio. Per completare la registrazione, conferma il tuo indirizzo email cliccando il bottone qui sotto.",
			`Il link è valido per ${hours} ore. Se non hai richiesto tu questa registrazione, puoi ignorare questa email.`,
		],
		ctaLabel: "Conferma la mia email",
		ctaUrl: url,
		footerNote:
			"Questa è un'email di servizio, inviata perché è stata richiesta la registrazione a Dromos Studio con questo indirizzo. Non è una comunicazione commerciale e non puoi disiscriverti. Per informazioni sul trattamento dei tuoi dati, consulta la nostra Privacy Policy su dromos.studio/privacy-policy.",
	});

	const text = `Ciao ${name},

Grazie per esserti registrato su Dromos Studio. Per completare la registrazione, conferma il tuo indirizzo email visitando questo link:

${url}

Il link è valido per ${hours} ore. Se non hai richiesto tu questa registrazione, puoi ignorare questa email.

Questa è un'email di servizio, non una comunicazione commerciale.`;

	return { subject: "Conferma il tuo indirizzo email — Dromos", html, text };
}

export function renderResetPassword(params: {
	name: string;
	url: string;
	expiresInMinutes: number;
}): EmailContent {
	const { name, url, expiresInMinutes } = params;
	const hours = Math.round(expiresInMinutes / 60);

	const html = renderShell({
		preheader: "Reimposta la tua password Dromos.",
		heading: `Ciao ${name}, reimposta la tua password`,
		bodyParagraphs: [
			"Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account Dromos Studio. Clicca il bottone qui sotto per scegliere una nuova password.",
			`Il link è valido per ${hours === 1 ? "1 ora" : `${hours} ore`}. Se non hai richiesto tu questa operazione, puoi ignorare questa email: la tua password attuale resterà invariata.`,
		],
		ctaLabel: "Reimposta la password",
		ctaUrl: url,
		footerNote:
			"Questa è un'email di servizio, inviata perché è stata richiesta la reimpostazione della password per questo account. Non è una comunicazione commerciale e non puoi disiscriverti. Per informazioni sul trattamento dei tuoi dati, consulta la nostra Privacy Policy su dromos.studio/privacy-policy.",
	});

	const text = `Ciao ${name},

Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account Dromos Studio. Visita questo link per scegliere una nuova password:

${url}

Il link è valido per ${hours === 1 ? "1 ora" : `${hours} ore`}. Se non hai richiesto tu questa operazione, puoi ignorare questa email: la tua password attuale resterà invariata.

Questa è un'email di servizio, non una comunicazione commerciale.`;

	return { subject: "Reimposta la tua password — Dromos", html, text };
}
