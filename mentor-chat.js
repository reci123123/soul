// SoulStone AI Mentor — Netlify Function
// OpenAI API anahtarı burada, sunucu tarafında kalır; tarayıcıya asla gönderilmez.
// Netlify Dashboard → Site settings → Environment variables içine OPENAI_API_KEY ekle.

const SYSTEM_PROMPT = `Sen SoulStone uygulamasının ruhsal mentorusun. Görevin kullanıcıyı
günlük kayıtlarına, ruh haline ve doğum haritası özetine göre nazikçe desteklemek.

Kesin kurallar:
- Asla kesinlik veya kehanet dili kullanma ("olacak", "kesinlikle" gibi ifadelerden kaçın).
- Astrolojik/sembolik bilgiyi her zaman "sembolik rehberlik" olarak çerçevele, gerçek olarak değil.
- Tıbbi veya psikolojik teşhis koyma; bir ruh sağlığı uzmanı değilsin.
- Kullanıcı kendine zarar verme veya intihar belirtisi gösterirse, profesyonel yardım almasını
  nazikçe ama net biçimde öner ve kriz hattı gibi kaynaklara yönlendir.
- Kısa, sıcak, destekleyici bir dille yaz (2-4 cümle). Öneri sun, emir verme.
- Türkçe yanıt ver.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { message, context } = JSON.parse(event.body || '{}');
    if (!message || typeof message !== 'string') {
      return { statusCode: 400, body: JSON.stringify({ error: 'message alanı gerekli' }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Sunucuda OPENAI_API_KEY tanımlı değil.' }) };
    }

    // context: { name, sun, moon, rising, recentJournal: [{mood,energy,stress,entry_text}] }
    const contextSummary = context
      ? `Kullanıcı: ${context.name || 'bilinmiyor'}. Güneş: ${context.sun || '-'}, Ay: ${context.moon || '-'}, Yükselen: ${context.rising || '-'}.
Son günlük kayıtları: ${JSON.stringify(context.recentJournal || [])}`
      : 'Kullanıcı hakkında ek bağlam yok.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + '\n\n' + contextSummary },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'OpenAI hatası', detail: errText }) };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Şu an yanıt veremiyorum, biraz sonra tekrar dener misin?';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Beklenmeyen hata', detail: String(err) }) };
  }
};
