function loadCategory(jsonFile) {
  const container = document.getElementById("content");

  fetch(`data/${jsonFile}`)
    .then(res => res.json())
    .then(items => {
      const section = document.createElement("section");
      items.forEach(item => {
        const article = document.createElement("article");

        const img = document.createElement("img");
        img.src = "assets/fallback.jpg";
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
        section.appendChild(article);
      });

      container.appendChild(section);
    });
}
