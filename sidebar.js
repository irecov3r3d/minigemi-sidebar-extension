const collectBtn = document.getElementById('collectBtn');
const broadcastBtn = document.getElementById('broadcastBtn');
const masterContext = document.getElementById('masterContext');

// Pass 1: Collect last message from each AI tab
collectBtn.addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({});
  let fullLog = "";

  for (const tab of tabs) {
    if (tab.url.includes("gemini.google.com") || tab.url.includes("claude.ai") || tab.url.includes("chatgpt.com")) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Selectors for the last message in each platform
          const selectors = [
            '.message-content', // Generic
            '.font-claude-message', // Claude
            '.markdown-prose', // GPT
            'message-content' // Gemini
          ];
          for (let s of selectors) {
            const elements = document.querySelectorAll(s);
            if (elements.length > 0) return elements[elements.length - 1].innerText;
          }
          return "No message found.";
        }
      });
      const name = tab.url.includes("gemini") ? "GEMINI" : tab.url.includes("claude") ? "CLAUDE" : "GPT";
      fullLog += `--- ${name} ---\n${results[0].result}\n\n`;
    }
  }
  masterContext.value = fullLog;
});

// Pass 2: Send content of textarea to all AI tabs
broadcastBtn.addEventListener('click', async () => {
  const textToSend = masterContext.value;
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (tab.url.includes("gemini.google.com") || tab.url.includes("claude.ai") || tab.url.includes("chatgpt.com")) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text) => {
          // Find the input field (works for most AI platforms)
          const input = document.querySelector('div[contenteditable="true"]') || document.querySelector('textarea') || document.querySelector('p');
          if (input) {
            if (input.tagName === 'DIV') input.innerText = text;
            else input.value = text;
            
            // Trigger the "input" event so the "Send" button enables
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
        args: [textToSend]
      });
    }
  }
});