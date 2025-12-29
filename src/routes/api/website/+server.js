import { GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_API_KEY } from '$env/static/private';

export async function GET() {
	const SPREADSHEET_ID = GOOGLE_SHEETS_SPREADSHEET_ID;
	const API_KEY = GOOGLE_SHEETS_API_KEY;
	const RANGE = 'algemeen!A:B';

	if (!SPREADSHEET_ID || !API_KEY) {
		return new Response(JSON.stringify({ error: 'Missing server environment variables' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
		RANGE
	)}?key=${API_KEY}`;

	try {
		const res = await fetch(url);
		if (!res.ok) {
			const text = await res.text();
			return new Response(JSON.stringify({ error: 'Sheets API error', detail: text }), {
				status: res.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		const data = await res.json();

		// Transform the data into a key-value object
		const values = data.values || [];
		const websiteInfo = {};

		for (const row of values) {
			if (row.length >= 2) {
				const key = row[0];
				const value = row[1];
				websiteInfo[key] = value;
			}
		}

		return new Response(JSON.stringify(websiteInfo), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Error fetching website info:', err);
		return new Response(JSON.stringify({ error: String(err) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
