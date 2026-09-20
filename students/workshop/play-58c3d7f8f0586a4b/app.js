const scoreElement = document.getElementById("workshop-game-score");
const clickButton = document.getElementById("workshop-game-click");
const resetButton = document.getElementById("reset-button");
const message = document.getElementById("message");
let score = 0;

clickButton.addEventListener("click", () => {
  score += 1;
  scoreElement.textContent = score;
  clickButton.classList.add("clicked");
  setTimeout(() => clickButton.classList.remove("clicked"), 110);
  if (score === 10) message.textContent = "10 poäng! Stjärnproffs! 🎉";
  else if (score === 25) message.textContent = "25 poäng! Helt otroligt! 🏆";
  else message.textContent = `Bra klickat! Du har ${score} poäng ⭐`;
});

resetButton.addEventListener("click", () => {
  score = 0;
  scoreElement.textContent = score;
  message.textContent = "Ny omgång – kör! 🚀";
});
