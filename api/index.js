export default async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).send("缺少图片URL参数");
  }

  try {
    // 兼容豆瓣电影/书/音乐全品类防盗链，自动重试
    const referers = [
      "https://movie.douban.com/",
      "https://book.douban.com/",
      "https://music.douban.com/",
      "https://www.douban.com/"
    ];
    
    let response;
    for (const referer of referers) {
      try {
        response = await fetch(url, {
          headers: {
            "Referer": referer,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
          }
        });
        if (response.ok) break;
      } catch (e) { continue; }
    }

    if (!response || !response.ok) {
      return res.status(404).send("图片获取失败");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 开启1年强缓存，CDN加速，第二次加载秒开
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
    
  } catch (err) {
    console.error("代理错误:", err);
    res.status(500).send("服务器内部错误");
  }
};
