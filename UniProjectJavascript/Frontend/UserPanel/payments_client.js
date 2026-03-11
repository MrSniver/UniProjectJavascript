async function loadPaymentMethods() {
    const res = await fetch("/api/user/payment-methods");
    const methods = await res.json();

    const list = document.getElementById("payment-methods-list");
    list.innerHTML = "";

    if (methods.length === 0) {
        list.innerHTML = "<li>Brak zapisanych metod płatności.</li>";
        return;
    }

    methods.forEach(m => {
        const li = document.createElement("li");
        li.textContent = `${m.type}: ${m.masked}`;
        list.appendChild(li);
    });
}

loadPaymentMethods();
