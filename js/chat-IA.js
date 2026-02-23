function initChat() {
    // Elementos do chat (agora existem no DOM)
    const chatArea1 = document.getElementById("chat-area-1");
    const chatArea2 = document.getElementById("chat-area-2");
    const chatMessages = document.getElementById("chatMessages");
    const userInput1 = document.getElementById("userInput1");
    const userInput2 = document.getElementById("userInput");
    const buttons = document.querySelectorAll(".chatButton");

    // Verificação de segurança
    if (!chatArea1 || !chatArea2 || !chatMessages || !userInput1 || !userInput2 || buttons.length === 0) {
        console.error("Elementos do chat não encontrados. Verifique o chat-box.html.");
        return;
    }

    // Estado do WebLLM
    let engine = null;
    let isModelReady = false;
    let pendingMessage = null;

    // --- Funções de UI ---
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user' : 'ai');
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('message', 'ai', 'typing-indicator');
        indicator.id = 'typingIndicator';
        indicator.textContent = '...';
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.remove();
    }

    // --- Monitoramento de input (habilita/desabilita botão) ---
    function setupInputMonitoring(input, button) {
        if (!input || !button) return;
        button.disabled = input.value.trim() === "";
        input.addEventListener("input", () => {
            button.disabled = input.value.trim() === "";
        });
    }

    // --- Verifica se WebLLM está disponível ---
    if (typeof window.webllm === 'undefined') {
        console.error("WebLLM não carregado. Verifique o script type=module.");
        addMessage("Erro: Biblioteca de IA não carregada. Recarregue a página.", 'ai');
        return;
    }
    const webllm = window.webllm;

    // --- Inicialização do WebLLM ---
    async function initWebLLM() {
        try {
            addMessage('Inicializando o modelo de IA (pode levar alguns segundos)...', 'ai');
            const model = 'TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC'; // modelo leve

            engine = await webllm.CreateMLCEngine(model, {
                initProgressCallback: (progress) => {
                    console.log('Progresso do modelo:', progress); // só no console
                }
            });

            isModelReady = true;
            removeTypingIndicator();

            // Atualiza a mensagem de inicialização
            const lastMsg = chatMessages.lastElementChild;
            if (lastMsg && lastMsg.classList.contains('ai') && lastMsg.textContent.includes('Inicializando')) {
                lastMsg.textContent = 'Modelo pronto!';
            } else {
                addMessage('Modelo pronto!', 'ai');
            }

            // Se havia mensagem pendente, envia agora
            if (pendingMessage) {
                await sendMessageToModel(pendingMessage);
                pendingMessage = null;
            }
        } catch (error) {
            console.error('Erro ao inicializar WebLLM:', error);
            addMessage(`Erro: ${error.message}`, 'ai');
            isModelReady = false;
        }
    }

    // --- Envia mensagem para o modelo ---
    async function sendMessageToModel(message) {
        if (!isModelReady || !engine) {
            addMessage('A IA ainda não está pronta. Aguarde...', 'ai');
            return;
        }

        showTypingIndicator();
        try {
            const reply = await engine.chat.completions.create({
                messages: [{ role: 'user', content: message }],
                temperature: 0.7,
                max_tokens: 500,
            });
            removeTypingIndicator();
            addMessage(reply.choices[0].message.content, 'ai');
        } catch (error) {
            console.error(error);
            removeTypingIndicator();
            addMessage(`Erro: ${error.message}`, 'ai');
        }
    }

    // --- Processa envio da área 2 ---
    async function handleSendMessage() {
        const message = userInput2.value.trim();
        if (!message) return;

        userInput2.disabled = true;
        const sendBtn = Array.from(buttons).find(btn => btn.closest('#chat-area-2'));
        if (sendBtn) sendBtn.disabled = true;

        addMessage(message, 'user');
        userInput2.value = '';

        if (!isModelReady || !engine) {
            addMessage('Inicializando IA. Mensagem será enviada em breve.', 'ai');
            pendingMessage = message;
            if (!engine) await initWebLLM();
        } else {
            await sendMessageToModel(message);
        }

        userInput2.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        userInput2.focus();
    }

    // --- Alterna da área 1 para a área 2 ---
    async function switchToChat2(initialMessage) {
        chatArea1.classList.add("desactive");
        chatArea2.classList.remove("desactive");
        chatArea2.classList.add("active");

        if (initialMessage) {
            addMessage(initialMessage, 'user');
        }

        if (!isModelReady || !engine) {
            if (initialMessage) pendingMessage = initialMessage;
            if (!engine) await initWebLLM();
        } else if (initialMessage) {
            await sendMessageToModel(initialMessage);
        }

        userInput2.focus();
    }

    // --- Configura monitoramento dos inputs ---
    buttons.forEach(btn => {
        const area = btn.closest('.chat-area');
        if (area) {
            const input = area.querySelector('input[type="text"]');
            setupInputMonitoring(input, btn);
        }
    });

    // --- Event Listeners ---
    buttons.forEach(btn => {
        btn.addEventListener("click", async function () {
            const area = btn.closest('.chat-area');
            if (area?.id === 'chat-area-1') {
                const msg = userInput1.value.trim();
                userInput1.value = '';
                await switchToChat2(msg);
            } else if (area?.id === 'chat-area-2') {
                await handleSendMessage();
            }
        });
    });

    userInput1.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const msg = userInput1.value.trim();
            userInput1.value = '';
            await switchToChat2(msg);
        }
    });

    userInput2.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            await handleSendMessage();
        }
    });

    // Se a área 2 já estiver ativa, inicia modelo em segundo plano
    if (!chatArea2.classList.contains('desactive') && chatArea2.classList.contains('active')) {
        userInput2.focus();
        if (!engine) initWebLLM();
    }
}

// Aguarda o evento de carregamento do chat
document.addEventListener('chatLoaded', initChat);

// Fallback caso o chat já esteja presente no DOM (ex.: se o script for executado depois)
if (document.getElementById('chat')?.children.length > 0) {
    initChat();
}