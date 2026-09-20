const scoreElement = document.getElementById("workshop-game-score");
const clickButton = document.getElementById("workshop-game-click");
const message = document.getElementById("game-message");
const resetButton = document.getElementById("reset-button");
let score = 0;

clickButton.addEventListener("click", () => {
  score += 1;
  scoreElement.textContent = score;
  scoreElement.classList.remove("pop");
  void scoreElement.offsetWidth;
  scoreElement.classList.add("pop");
  if (score === 10) message.textContent = "10 poäng! Superraket! 🌟";
  else if (score === 25) message.textContent = "25 poäng! Du flyger genom galaxen! 🌌";
  else if (score === 50) message.textContent = "50 poäng! Klickmästare! 🏆";
  else message.textContent = `Snyggt! Du har ${score} stjärnpoäng!`;
});

resetButton.addEventListener("click", () => {
  score = 0;
  scoreElement.textContent = score;
  message.textContent = "Redo för en ny raketstart? 🚀";
});
