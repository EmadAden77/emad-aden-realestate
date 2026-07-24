export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const { message } = req.body;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(200).json({ reply: "خدمة المساعد غير مفعلة حالياً، تواصل معنا مباشرة عبر واتساب: +967773571889" });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // غيرنا الموديل لموديل أقوى وأسرع
                messages: [
                    { role: "system", content: "أنت مساعد عدني فزعة لمكتب عماد عدن العقاري. هرجك عدني قح ومختصر جداً." },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        
        // لو المفتاح خلص، بنعطيه رد بديل محترم
        if (data.error) {
            return res.status(200).json({ reply: "يا حيا بك يابو عماد، السيرفر عليه ضغط عالمي الحين، اهدأ عليه ثواني وارجع اسألني وبجاوبك فديت خشمك!" });
        }

        res.status(200).json({ reply: data.choices[0].message.content });
    } catch (error) {
        res.status(200).json({ reply: "يا حيا بك، الشبكة تعبانة شوي، كرر سؤالك يا وحش." });
    }
}
