const scoreElement = document.getElementById("workshop-game-score");
const clickButton = document.getElementById("workshop-game-click");
const cheerElement = document.getElementById("cheer");
let score = 0;

clickButton.addEventListener("click", () => {
  score += 1;
  scoreElement.textContent = score;
  scoreElement.classList.remove("pop");
  void scoreElement.offsetWidth;
  scoreElement.classList.add("pop");
  cheerElement.textContent = score % 10 === 0 ? `WOW! ${score} poäng! 🏆` : score % 5 === 0 ? "Superbra klickat! 🌟" : "Pling! Du fick en poäng! ✨";
});
