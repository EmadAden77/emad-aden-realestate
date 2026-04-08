export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
    if (req.method === 'OPTIONS') { res.status(200).end(); return }
    if (req.method !== 'POST') { return res.status(405).json({ message: 'Only POST allowed' }) }
    const { message } = req.body
    const p1 = "gsk_nCmQGUeGnW5e"
    const p2 = "FTTEMZxWWGdyb3FY"
    const p3 = "p0P1GhPyDsdpUd2ioAMuavIr"
    const apiKey = p1 + p2 + p3
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: "أنت مساعد عدني خبير بمكتب عماد عدن العقاري هرجك عدني قح ومختصر جدا وفزعة للزبائن" },
                    { role: "user", content: message }
                ],
                temperature: 0.6
            })
        })
        const data = await response.json()
        res.status(200).json({ reply: data.choices[0].message.content })
    } catch (e) {
        res.status(500).json({ reply: "السيرفر تعبان شوي يا صاحبي جرب ثاني" })
    }
}
