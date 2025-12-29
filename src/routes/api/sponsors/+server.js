import { GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_API_KEY } from '$env/static/private';

export async function GET() {
	const SPREADSHEET_ID = GOOGLE_SHEETS_SPREADSHEET_ID;
	const API_KEY = GOOGLE_SHEETS_API_KEY;
	const RANGE = 'sponsors!A:C';

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

		// Transform the data into an array of sponsor objects
		const values = data.values || [];
		const sponsors = [];

		// Skip header row if it exists
		const startIndex =
			values.length > 0 && (values[0][0] === 'LogoLink' || values[0][0] === 'SponsorWebsite')
				? 1
				: 0;

		for (let i = startIndex; i < values.length; i++) {
			const row = values[i];
			if (row.length >= 2 && row[0] && row[1]) {
				let imageUrl = row[0];

				// Convert Google Drive URLs to direct view URLs
				if (imageUrl.includes('drive.google.com')) {
					const fileIdMatch = imageUrl.match(/[-\w]{25,}/);
					if (fileIdMatch) {
						const driveUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[0]}`;
						// Proxy through our own API to avoid CORS/403 issues
						imageUrl = `/api/sponsors/image?url=${encodeURIComponent(driveUrl)}`;
					}
				}

				sponsors.push({
					image: imageUrl,
					url: row[1],
					name: row[2] || ''
				});
			}
		}

		return new Response(JSON.stringify(sponsors), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Error fetching sponsors:', err);
		return new Response(JSON.stringify({ error: String(err) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
