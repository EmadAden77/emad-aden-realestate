// Deployment refresh: reload secure Facebook environment variables (2026-07-30).
export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const pageId = process.env.FB_PAGE_ID;
  const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const graphVersion = process.env.FB_GRAPH_VERSION || 'v26.0';

  if (!pageId || !accessToken) {
    return response.status(500).json({ error: 'Facebook environment variables are missing' });
  }

  const fields = ['id', 'message', 'created_time', 'permalink_url', 'full_picture'].join(',');
  const graphUrl = new URL(`https://graph.facebook.com/${graphVersion}/${pageId}/posts`);
  graphUrl.searchParams.set('fields', fields);
  graphUrl.searchParams.set('limit', '6');
  graphUrl.searchParams.set('access_token', accessToken);

  try {
    const facebookResponse = await fetch(graphUrl, {
      headers: { Accept: 'application/json' }
    });
    const facebookData = await facebookResponse.json();

    if (!facebookResponse.ok) {
      console.error('Facebook API error:', facebookData);
      return response.status(facebookResponse.status).json({
        error: 'Unable to load Facebook posts'
      });
    }

    const posts = (facebookData.data || [])
      .filter(post => post.message || post.full_picture)
      .map(post => ({
        id: post.id,
        message: post.message || 'منشور جديد من مكتب عماد عدن العقاري',
        image: post.full_picture || null,
        publishedAt: post.created_time,
        url: post.permalink_url
      }));

    response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response.status(200).json({ posts });
  } catch (error) {
    console.error('Facebook request failed:', error);
    return response.status(500).json({ error: 'Facebook service is currently unavailable' });
  }
}
