
document.getElementById("confirm-old-btn").addEventListener("click", async () => {
    const oldPass = document.getElementById("old-password").value;

    const res = await fetch("/api/user/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPass })
    });

    const data = await res.json();

    if (!data.valid) {
        document.getElementById("old-pass-status").textContent = "Niepoprawne hasło.";
        document.getElementById("old-pass-status").style.color = "red";
        return;
    }

    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
});


document.getElementById("save-password-btn").addEventListener("click", async () => {
    const newPass = document.getElementById("new-password").value;
    const confirmPass = document.getElementById("confirm-password").value;

    if (newPass !== confirmPass) {
        document.getElementById("password-status").textContent = "Hasła nie są takie same.";
        document.getElementById("password-status").style.color = "red";
        return;
    }

    const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPass })
    });

    const data = await res.json();

    document.getElementById("password-status").textContent = "Hasło zostało zmienione";
    document.getElementById("password-status").style.color = "lime";
});
