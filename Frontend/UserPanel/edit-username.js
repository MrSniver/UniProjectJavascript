document.getElementById("save-username-btn").addEventListener("click", async () => {
    const newName = document.getElementById("new-username").value;

    if (!newName || newName.trim() === "") {
        document.getElementById("username-status").textContent = "Podaj nową nazwę użytkownika.";
        document.getElementById("username-status").style.color = "red";
        return;
    }

    const res = await fetch("/api/user/change-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newName })
    });

    const data = await res.json();

    document.getElementById("username-status").textContent = "Zmieniono nazwę użytkownika";
    document.getElementById("username-status").style.color = "lime";
});
