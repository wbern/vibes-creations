const scoreElement = document.getElementById("workshop-game-score");
const clickButton = document.getElementById("workshop-game-click");
const messageElement = document.getElementById("game-message");

let score = 0;

clickButton.addEventListener("click", () => {
  score += 1;
  scoreElement.textContent = score;

  clickButton.classList.add("clicked");
  setTimeout(() => clickButton.classList.remove("clicked"), 120);

  if (score === 10) {
    messageElement.textContent = "Wow, 10 poäng! Du är en stjärna! 🌟";
  } else if (score % 5 === 0) {
    messageElement.textContent = `${score} poäng! Raketen flyger högre! 🚀`;
  } else {
    messageElement.textContent = "+1 stjärnpoäng! ✨";
  }
});
