export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing ?url= parameter', { status: 400 });
  }

  try {
    // 验证 URL 格式
    const targetUrl = new URL(imageUrl);
    
    // 可选：限制只代理特定域名（如豆瓣）
    // const allowedHosts = ['img9.doubanio.com', 'img2.doubanio.com', 'img1.doubanio.com'];
    // if (!allowedHosts.includes(targetUrl.hostname)) {
    //   return new Response('Forbidden domain', { status: 403 });
    // }

    // 获取图片
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://movie.douban.com/', // 重要：绕过防盗链
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      },
      redirect: 'follow'
    });

    if (!imageResponse.ok) {
      return new Response(`Failed to fetch image: ${imageResponse.status}`, { 
        status: imageResponse.status 
      });
    }

    // 返回图片
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const contentLength = imageResponse.headers.get('content-length');
    
    return new Response(imageResponse.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || '',
        'Cache-Control': 'public, max-age=31536000, immutable', // 1年缓存
        'Access-Control-Allow-Origin': '*',
        'X-Proxy-By': 'Vercel Image Proxy'
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}