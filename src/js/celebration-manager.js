class CelebrationManager {
  constructor() {
    this.celebrationGifs = Array.from(
      { length: 22 },
      (_, i) => `/gifs/${i + 1}.webp`
    );
  }

  getRandomGif() {
    const randomIndex = Math.floor(Math.random() * this.celebrationGifs.length);
    return this.celebrationGifs[randomIndex];
  }

  createGifElement() {
    const gifContainer = document.createElement("div");
    gifContainer.className = "celebration-gif-container";

    const gifImage = document.createElement("img");
    gifImage.src = this.getRandomGif();
    gifImage.className = "celebration-gif";
    gifImage.alt = "Celebration";

    gifContainer.appendChild(gifImage);
    return gifContainer;
  }
}

export default CelebrationManager;
