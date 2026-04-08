export default async function handler(req, res) {
    // إعدادات السماح بالاتصال من أي مكان عشان ما يعلق الموقع
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { message } = req.body;
    // مفتاحك اللي شغال مية مية
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
                    { role: "system", content: "أنت مساعد عدني خبير بمكتب عماد عدن العقاري. هرجك عدني قح ومختصر جداً وفزعة للزبائن. رقم التواصل 773571889." },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        res.status(200).json({ reply: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ reply: "السموحة منك يابو عماد السيرفر فيه قروشة جرب ثاني" });
    }
}
