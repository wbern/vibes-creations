const scoreElement = document.getElementById("workshop-game-score");
const clickButton = document.getElementById("workshop-game-click");
const messageElement = document.getElementById("message");
let score = 0;

clickButton.addEventListener("click", () => {
  score += 1;
  scoreElement.textContent = score;
  clickButton.classList.add("clicked");
  setTimeout(() => clickButton.classList.remove("clicked"), 100);
  messageElement.textContent = score % 10 === 0 ? `Otroligt! ${score} stjärnpoäng! 🎉` : score >= 5 ? "Superklickat! ⭐" : "Bra klick! 🚀";
});
