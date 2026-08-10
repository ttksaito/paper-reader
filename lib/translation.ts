/**
 * 翻訳サービス
 *
 * デフォルトではMyMemory Translation APIを使用（無料、認証不要）
 * 他の翻訳APIに切り替える場合は、以下の関数を変更してください。
 */

interface TranslationResult {
  translatedText: string;
  error?: string;
}

/**
 * MyMemory Translation APIを使用して翻訳
 * https://mymemory.translated.net/doc/spec.php
 *
 * 制限: 1日あたり10,000語まで無料
 */
async function translateWithMyMemory(
  text: string,
  sourceLang: string = 'en',
  targetLang: string = 'ja'
): Promise<TranslationResult> {
  try {
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${sourceLang}|${targetLang}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData) {
      return {
        translatedText: data.responseData.translatedText,
      };
    } else {
      return {
        translatedText: '',
        error: 'Translation failed',
      };
    }
  } catch (error) {
    console.error('Translation error:', error);
    return {
      translatedText: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Google Translate API を使用する場合（要API キー）
 * 環境変数 NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY に設定
 */
async function translateWithGoogle(
  text: string,
  targetLang: string = 'ja'
): Promise<TranslationResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;

  if (!apiKey) {
    console.warn('Google Translate API key not found. Using MyMemory instead.');
    return translateWithMyMemory(text);
  }

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
      }),
    });

    const data = await response.json();

    if (data.data && data.data.translations && data.data.translations.length > 0) {
      return {
        translatedText: data.data.translations[0].translatedText,
      };
    } else {
      return {
        translatedText: '',
        error: 'Translation failed',
      };
    }
  } catch (error) {
    console.error('Google Translate error:', error);
    return {
      translatedText: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * DeepL API を使用する場合（要API キー）
 * 環境変数 NEXT_PUBLIC_DEEPL_API_KEY に設定
 */
async function translateWithDeepL(
  text: string,
  targetLang: string = 'JA'
): Promise<TranslationResult> {
  const apiKey = process.env.NEXT_PUBLIC_DEEPL_API_KEY;

  if (!apiKey) {
    console.warn('DeepL API key not found. Using MyMemory instead.');
    return translateWithMyMemory(text);
  }

  try {
    const url = 'https://api-free.deepl.com/v2/translate';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        target_lang: targetLang,
      }),
    });

    const data = await response.json();

    if (data.translations && data.translations.length > 0) {
      return {
        translatedText: data.translations[0].text,
      };
    } else {
      return {
        translatedText: '',
        error: 'Translation failed',
      };
    }
  } catch (error) {
    console.error('DeepL Translate error:', error);
    return {
      translatedText: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * メインの翻訳関数
 *
 * 使用する翻訳サービスを選択できます。
 * デフォルトはMyMemory（無料、認証不要）
 */
export async function translateText(
  text: string,
  options?: {
    service?: 'mymemory' | 'google' | 'deepl';
    sourceLang?: string;
    targetLang?: string;
  }
): Promise<TranslationResult> {
  const service = options?.service || 'mymemory';

  switch (service) {
    case 'google':
      return translateWithGoogle(text, options?.targetLang);
    case 'deepl':
      return translateWithDeepL(text, options?.targetLang);
    case 'mymemory':
    default:
      return translateWithMyMemory(
        text,
        options?.sourceLang,
        options?.targetLang
      );
  }
}
