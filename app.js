const categories = {
  "Broadcast Graphics": "onair-graphics.json",
  "Newsroom & NRCS": "newsroom.json",
  "Playout & Automation": "playout.json",
  "IP / SMPTE 2110": "ip-video.json",
  "Audio Technology": "audio.json",
  "Cloud & AI": "cloud-ai.json"
};

const container = document.getElementById("content");

function renderItem(item) {
  const article = document.createElement("article");

  const img = document.createElement("img");
  img.src = "assets/fallback.jpg";   // ALWAYS start with fallback
  img.loading = "lazy";

  if (item.image) {
    const testImg = new Image();
    testImg.onload = () => img.src = item.image;
    testImg.src = item.image;
  }

  const text = document.createElement("div");
  text.innerHTML = `
    <a href="${item.link}" target="_blank">${item.title}</a>
    <p>${item.source}</p>
  `;

  article.appendChild(img);
  article.appendChild(text);

  return article;
}

for (const [title, file] of Object.entries(categories)) {
  fetch(`data/${file}`)
    .then(res => res.json())
    .then(items => {
      const section = document.createElement("section");
      section.innerHTML = `<h2>${title}</h2>`;
      items.slice(0, 10).forEach(i => section.appendChild(renderItem(i)));
      container.appendChild(section);
    });
}
