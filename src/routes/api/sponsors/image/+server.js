export async function GET({ url }) {
	const imageUrl = url.searchParams.get('url');

	if (!imageUrl) {
		return new Response('Missing url parameter', { status: 400 });
	}

	try {
		// Fetch the image from Google Drive without referrer
		const response = await fetch(imageUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)'
			}
		});

		if (!response.ok) {
			return new Response(`Failed to fetch image: ${response.status}`, {
				status: response.status
			});
		}

		const contentType = response.headers.get('content-type') || 'image/png';
		const imageBuffer = await response.arrayBuffer();

		return new Response(imageBuffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400' // Cache for 1 day
			}
		});
	} catch (err) {
		console.error('Error proxying image:', err);
		return new Response(`Error fetching image: ${err}`, { status: 500 });
	}
}
