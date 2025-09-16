const YANDEX_GPT_CONFIG = {
  apiKey: process.env.YANDEX_GPT_API_KEY,
  folderId: process.env.YANDEX_FOLDER_ID,
  baseUrl: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
};

export const generateTourDescription = async (imagesData, context = '') => {
  try {
    const prompt = {
      modelUri: `gpt://${YANDEX_GPT_CONFIG.folderId}/yandexgpt/latest`,
      completionOptions: {
        stream: false,
        temperature: 0.6,
        maxTokens: 2000
      },
      messages: [
        {
          role: 'system',
          text: 'Ты профессиональный гид и эксперт по созданию увлекательных описаний для виртуальных туров. Создай краткое, информативное и engaging описание на основе предоставленных данных.'
        },
        {
          role: 'user',
          text: `Создай описание для виртуального тура на основе следующих данных:
          Количество изображений: ${imagesData.length}
          Контекст: ${context}
          Создай описание на русском языке длиной 2-3 абзаца.`
        }
      ]
    };

    const response = await fetch(YANDEX_GPT_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${YANDEX_GPT_CONFIG.apiKey}`
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      throw new Error(`Ошибка Yandex GPT: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result.alternatives[0].message.text;
  } catch (error) {
    console.error('Ошибка при генерации описания:', error);
    throw error;
  }
};

export const generateNavigationTips = async (tourData) => {
  try {
    const prompt = {
      modelUri: `gpt://${YANDEX_GPT_CONFIG.folderId}/yandexgpt/latest`,
      completionOptions: {
        stream: false,
        temperature: 0.5,
        maxTokens: 1000
      },
      messages: [
        {
          role: 'system',
          text: 'Ты помощник по созданию навигационных подсказок для виртуальных туров. Создай краткие, понятные инструкции для перемещения между точками тура.'
        },
        {
          role: 'user',
          text: `Создай навигационные подсказки для тура с ${tourData.points.length} точками.
          Верни ответ в формате JSON с полями: pointId, instruction.`
        }
      ]
    };

    const response = await fetch(YANDEX_GPT_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${YANDEX_GPT_CONFIG.apiKey}`
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      throw new Error(`Ошибка Yandex GPT: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.result.alternatives[0].message.text);
  } catch (error) {
    console.error('Ошибка при генерации подсказок:', error);
    throw error;
  }
};
