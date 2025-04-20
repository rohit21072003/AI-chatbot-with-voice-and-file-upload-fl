const promptInput = document.querySelector("#prompt");
const submitBtn = document.querySelector("#submit");
const chatContainer = document.querySelector(".chat-container");
const imageBtn = document.querySelector("#image");
const image = document.querySelector("#image img");
const imageInput = document.querySelector("#image input");
const voiceBtn = document.querySelector("#voice");

const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCWDfDI7M3qZq4AMQ9R19ZSddHwfJWfXNU";

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;

function setupVoiceRecognition() {
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            voiceBtn.classList.add('listening');
        };

        recognition.onend = () => {
            isListening = false;
            voiceBtn.classList.remove('listening');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            promptInput.value = transcript;
            handleChatResponse(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            voiceBtn.classList.remove('listening');
        };
    } else {
        voiceBtn.style.display = 'none';
        console.warn('Speech Recognition API not supported');
    }
}

voiceBtn.addEventListener('click', () => {
    if (!recognition) {
        setupVoiceRecognition();
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (e) {
            console.error('Speech recognition error:', e);
        }
    }
});

async function generateResponse(aiChatBox) {
    const text = aiChatBox.querySelector(".ai-chat-area");
    const parts = [{ text: user.message }];
    
    if (user.file.data) {
        parts.push({
            inline_data: {
                mime_type: user.file.mime_type,
                data: user.file.data
            }
        });
    }

    const requestOptions = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: parts
            }]
        })
    };

    try {
        const response = await fetch(Api_Url, requestOptions);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const apiResponse = data.candidates[0].content.parts[0].text
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .trim();
            text.innerHTML = apiResponse;
        } else {
            throw new Error("Unexpected API response structure");
        }
    } catch(error) {
        console.error("Error generating response:", error);
        text.innerHTML = "Sorry, I encountered an error. Please try again.";
    } finally {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
        image.src = "img.svg";
        image.classList.remove("choose");
        user.file = {};
    }
}

function createChatBox(html, className) {
    const div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(className);
    return div;
}

function handleChatResponse(userMessage) {
    user.message = userMessage;
    const html = `
        <img src="user.png" alt="User" id="userImage" width="8%">
        <div class="user-chat-area">
            ${user.message}
            ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
        </div>`;
    
    promptInput.value = "";
    const userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });

    setTimeout(() => {
        const aiHtml = `
            <img src="ai.png" alt="AI" id="aiImage" width="10%">
            <div class="ai-chat-area">
                <img src="loading.webp" alt="Loading" class="load" width="50px">
            </div>`;
        const aiChatBox = createChatBox(aiHtml, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        generateResponse(aiChatBox);
    }, 600);
}

promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && promptInput.value.trim()) {
        handleChatResponse(promptInput.value);
    }
});

submitBtn.addEventListener("click", () => {
    if (promptInput.value.trim()) {
        handleChatResponse(promptInput.value);
    }
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64string = e.target.result.split(",")[1];
        user.file = {
            mime_type: file.type,
            data: base64string
        };
        image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        image.classList.add("choose");
    };
    reader.readAsDataURL(file);
});

imageBtn.addEventListener("click", () => {
    imageInput.click();
});













