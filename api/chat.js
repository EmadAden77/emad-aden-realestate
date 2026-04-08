export default async function handler(req, res) {
    // إعدادات السماح بالاتصال
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { message } = req.body;
    // المفتاح القوي والشغال
    const key = "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";

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: "أنت مساعد عدني خبير بمكتب عماد عدن العقاري. هرجك عدني قح وفزعة للزبائن. رقم التواصل 773571889." },
                    { role: "user", content: message }
                ],
                temperature: 0.6
            })
        });

        const data = await response.json();
        const botReply = data.choices?.[0]?.message?.content || "السموحة منك يابو عماد السيرفر مضغوط شوي جرب ثاني";
        res.status(200).json({ reply: botReply });
    } catch (error) {
        res.status(500).json({ reply: "أوه يابو عماد في قروشة بالشبكة جرب مرة ثانية" });
    }
}
