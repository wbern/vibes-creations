const scoreElement = document.getElementById("workshop-game-score");
const clickButton = document.getElementById("workshop-game-click");
const messageElement = document.getElementById("game-message");
let score = 0;

clickButton.addEventListener("click", () => {
  score += 1;
  scoreElement.textContent = score;
  clickButton.classList.add("clicked");
  window.setTimeout(() => clickButton.classList.remove("clicked"), 100);
  messageElement.textContent = score === 10
    ? "🌟 Wow! 10 stjärnpoäng!"
    : `Raketen flyger! Du har ${score} poäng.`;
});
