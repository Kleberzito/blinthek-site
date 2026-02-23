document.addEventListener("DOMContentLoaded", () => {
    function loadPage(url, targetId) {
        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("Erro ao carregar: " + url);
                return response.text();
            })
            .then(data => {
                document.getElementById(targetId).innerHTML = data;
            })
            .catch(error => console.error("Erro:", error));
    }

    // Carrega partes comuns
    loadPage("navbar.html", "navbar");
    loadPage("footer.html", "footer");

    // Carrega o chat e, quando terminar, dispara evento
    loadPage("chat-box.html", "chat").then(() => {
        document.dispatchEvent(new CustomEvent('chatLoaded'));
    });
});