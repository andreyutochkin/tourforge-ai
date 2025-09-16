const API_CONFIG = {
  baseURL: 'https://api.sber.ai/gpt3',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SBER_AI_API_KEY'
  }
};

async function sendRequest(prompt) {
  try {
    const response = await fetch(API_CONFIG.baseURL + '/complete', {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 1000,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].text;
  } catch (error) {
    console.error('API request failed:', error);
    showError('Ошибка соединения с AI-сервисом');
    return null;
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}
