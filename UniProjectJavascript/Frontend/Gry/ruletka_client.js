
const numbersGrid = document.querySelector(".numbers-grid");

const redNumbers = [
    1,3,5,7,9,12,14,16,18,
    19,21,23,25,27,30,32,34,36
];

const topRow    = [3,6,9,12,15,18,21,24,27,30,33,36];
const middleRow = [2,5,8,11,14,17,20,23,26,29,32,35];
const bottomRow = [1,4,7,10,13,16,19,22,25,28,31,34];

const layout = [topRow, middleRow, bottomRow];

layout.forEach(row => {
    row.forEach(number => {
        const btn = document.createElement("button");
        btn.classList.add("bet-btn");

        if (redNumbers.includes(number)) {
            btn.classList.add("red");
        } else {
            btn.classList.add("black");
        }

        btn.textContent = number;
        numbersGrid.appendChild(btn);
    });
});

let selectedBet = null;

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("bet-btn")) {

        document.querySelectorAll(".bet-btn.selected")
            .forEach(btn => btn.classList.remove("selected"));

        e.target.classList.add("selected");
        selectedBet = parseInt(e.target.textContent);
    }
});

// Save game history function
async function saveGameHistory(gameType, gameStatus, wonAmount) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('User not logged in, skipping game history save');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/games/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                gameType: gameType,
                gameStatus: gameStatus,
                wonAmount: wonAmount
            })
        });

        if (response.ok) {
            console.log('Game history saved successfully');
        } else {
            console.error('Failed to save game history:', response.status);
        }
    } catch (error) {
        console.error('Error saving game history:', error);
    }
}

// Dodaj zero do gry
const zeroBtn = document.querySelector(".zero-slot .bet-btn");
if (zeroBtn) {
    zeroBtn.addEventListener("click", () => {
        document.querySelectorAll(".bet-btn.selected")
            .forEach(btn => btn.classList.remove("selected"));
        
        zeroBtn.classList.add("selected");
        selectedBet = 0;
    });
}


const canvas = document.getElementById("roulette-wheel");
const ctx = canvas.getContext("2d");
const radius = canvas.width / 2;

const wheelNumbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6,
    27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
    16, 33, 1, 20, 14, 31, 9, 22, 18, 29,
    7, 28, 12, 35, 3, 26
];

function drawWheel() {
    const angleStep = (2 * Math.PI) / wheelNumbers.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < wheelNumbers.length; i++) {
        const startAngle = i * angleStep;
        const endAngle = startAngle + angleStep;

        if (wheelNumbers[i] === 0) {
            ctx.fillStyle = "#27ae60";
        } else if (redNumbers.includes(wheelNumbers[i])) {
            ctx.fillStyle = "#c0392b";
        } else {
            ctx.fillStyle = "#2c3e50";
        }

        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(startAngle + angleStep / 2);
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText(wheelNumbers[i], radius * 0.75, 5);
        ctx.restore();
    }
}

drawWheel();

function highlightWinningNumber(num) {
    document.querySelectorAll(".bet-btn").forEach(btn => {
        btn.classList.remove("win");
    });

    const btn = Array.from(document.querySelectorAll(".bet-btn"))
        .find(b => parseInt(b.textContent) === num);

    if (btn) btn.classList.add("win");
}

document.getElementById("spin-btn").addEventListener("click", async () => {
    if (selectedBet === null) {
        alert("Wybierz liczbę!");
        return;
    }

    const betAmount = parseInt(document.getElementById("bet-amount").value);
    
    if (isNaN(betAmount) || betAmount <= 0) {
        alert("Podaj prawidłową stawkę!");
        return;
    }

    try {
        // Place bet (deduct currency)
        const betSuccess = await placeBet(betAmount);
        if (!betSuccess) {
            alert("Nie masz wystarczającej ilości waluty!");
            return;
        }

        // Losowanie liczby (0-36)
        const resultNumber = Math.floor(Math.random() * 37);
        
        // Sprawdź czy gracz wygrał
        const win = (resultNumber === selectedBet);
        
        // Oblicz wypłatę (35:1 za trafienie dokładnej liczby + zwrot stawki)
        const payout = win ? betAmount * 36 : 0;

        // Wyświetl wynik
        highlightWinningNumber(resultNumber);

        const msg = document.getElementById("status-message");

        if (win) {
            // Add winnings to player account
            await addWinnings(payout);
            msg.textContent = `Wypadło: ${resultNumber}. Wygrałeś ${payout} monet!`;
            msg.style.color = "lime";
        } else {
            msg.textContent = `Wypadło: ${resultNumber}. Niestety przegrana. Straciłeś ${betAmount} monet.`;
            msg.style.color = "red";
        }
        
        // Save game history
        const gameStatus = win ? 'win' : 'lose';
        await saveGameHistory('roulette', gameStatus, payout);
        
        // Reset wyboru po grze
        document.querySelectorAll(".bet-btn.selected")
            .forEach(btn => btn.classList.remove("selected"));
        selectedBet = null;

    } catch (error) {
        console.error('Error during roulette game:', error);
        alert('Wystąpił błąd podczas gry. Spróbuj ponownie.');
    }
});
