const scoreElement = document.getElementById("workshop-game-score");
const clickButton = document.getElementById("workshop-game-click");
const resetButton = document.getElementById("reset-button");
const message = document.getElementById("message");
let score = 0;

clickButton.addEventListener("click", () => {
  score += 1;
  scoreElement.textContent = score;
  scoreElement.classList.remove("pop");
  void scoreElement.offsetWidth;
  scoreElement.classList.add("pop");
  if (score === 10) message.textContent = "Wow, 10 stjärnor! 🌟";
  else if (score === 25) message.textContent = "Superkodare! 🚀";
  else if (score === 50) message.textContent = "Galaxmästare! 🏆";
  else message.textContent = "Snyggt klick! +1 ✨";
});

resetButton.addEventListener("click", () => {
  score = 0;
  scoreElement.textContent = score;
  message.textContent = "Ny runda – kör! 🎮";
});
