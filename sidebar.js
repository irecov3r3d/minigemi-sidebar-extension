const collectBtn = document.getElementById('collectBtn');
const broadcastBtn = document.getElementById('broadcastBtn');
const clearBtn = document.getElementById('clearBtn');
const masterContext = document.getElementById('masterContext');

// Pass 1: Collect last message from each AI tab
collectBtn.addEventListener('click', async () => {
  try {
    const tabs = await chrome.tabs.query({});
    let fullLog = "";

    for (const tab of tabs) {
      if (tab.url && (tab.url.includes("gemini.google.com") || tab.url.includes("claude.ai") || tab.url.includes("chatgpt.com"))) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Selectors for the last message in each platform
            const selectors = [
              '.markdown-prose', // GPT
              '.font-claude-message', // Claude
              '.message-content' // Gemini
            ];
            for (let s of selectors) {
              const elements = document.querySelectorAll(s);
              if (elements.length > 0) return elements[elements.length - 1].innerText;
            }
            return "No message found.";
          }
        });
        const name = tab.url.includes("gemini") ? "GEMINI" : tab.url.includes("claude") ? "CLAUDE" : "GPT";
        if (results && results[0]) {
          fullLog += `--- ${name} ---\n${results[0].result}\n\n`;
        }
      }
    }
    masterContext.value = fullLog;
  } catch (error) {
    console.error("Collection failed:", error);
  }
});

// Pass 2: Send content of textarea to all AI tabs
broadcastBtn.addEventListener('click', async () => {
  try {
    const textToSend = masterContext.value;
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      if (tab.url && (tab.url.includes("gemini.google.com") || tab.url.includes("claude.ai") || tab.url.includes("chatgpt.com"))) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text) => {
            // Find the input field
            const input = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea');
            if (input) {
              if (input.tagName === 'DIV') {
                input.innerText = text;
              } else {
                input.value = text;
              }

              // Trigger the "input" event so the "Send" button enables
              input.dispatchEvent(new Event('input', { bubbles: true }));

              // Optional: Simulate Enter key (many platforms require this)
              const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
              });
              input.dispatchEvent(enterEvent);
            }
          },
          args: [textToSend]
        });
      }
    }
  } catch (error) {
    console.error("Broadcast failed:", error);
  }
});

// Clear Button
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    masterContext.value = '';
  });
}
