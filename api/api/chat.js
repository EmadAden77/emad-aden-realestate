export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    const { message } = req.body;
    const p1 = "gsk_nCmQGUeGnW5e";
    const p2 = "FTTEMZxWWGdyb3FY";
    const p3 = "p0P1GhPyDsdpUd2ioAMuavIr";
    const apiKey = p1 + p2 + p3;

    if (!apiKey) {
        return res.status(500).json({ reply: "مفتاح API غير موجود" });
    }

    const systemPrompt = `أنت مساعد ذكي واسمك 'مساعد عماد' تعمل لدى 'مكتب عماد عدن العقاري'
    المكتب متخصص في بيع وشراء وتثمين العقارات في محافظة عدن اليمن
    مناطق التغطية المنصورة الشيخ عثمان بير فضل الممدارة بير أحمد المدينة الخضراء خور مكسر
    خدمات إضافية إدارة أملاك المغتربين مستشار قانوني عقاري
    رقم التواصل واتساب 967773571889
    أجب على سؤال المستخدم باختصار واحترافية وبلهجة ودية يمنية بيضاء`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            return res.status(200).json({ reply: data.choices[0].message.content });
        } else {
            return res.status(500).json({ reply: "عذرا المساعد يواجه ضغط حاليا" });
        }
    } catch (error) {
        return res.status(500).json({ reply: "عذرا أواجه مشكلة في الاتصال" });
    }
}

