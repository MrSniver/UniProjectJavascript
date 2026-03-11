async function loadGameHistory() {
    const res = await fetch("/api/user/game-history");
    const history = await res.json();

    const tbody = document.getElementById("game-history-body");
    tbody.innerHTML = "";

    history.forEach(entry => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.game}</td>
            <td class="${entry.result === 'win' ? 'win-text' : 'lose-text'}">
                ${entry.result === 'win' ? 'Wygrana' : 'Przegrana'}
            </td>
            <td>${entry.amount}</td>
        `;

        tbody.appendChild(tr);
    });
}

loadGameHistory();
