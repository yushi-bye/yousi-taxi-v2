
export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})
  const { orderId, amount, productName } = req.body
  const channelId = process.env.LINE_PAY_CHANNEL_ID
  const channelSecret = process.env.LINE_PAY_CHANNEL_SECRET
  const isSandbox = process.env.LINE_PAY_SANDBOX === 'true'
  if(!channelId || !channelSecret){
    return res.json({ info: '尚未設定 LINE Pay 商家金鑰，目前為模擬模式。請到 Vercel → Settings → Environment Variables 設定後再部署', mock:true, orderId, amount })
  }
  const apiUrl = isSandbox ? 'https://sandbox-api-pay.line.me/v3/payments/request' : 'https://api-pay.line.me/v3/payments/request'
  try{
    const body = {
      amount, currency: 'TWD', orderId,
      packages: [{ id: 'yousi_taxi', amount, name: 'Yousi 玉里叫車', products: [{ name: productName || '玉里叫車', quantity: 1, price: amount }] }],
      redirectUrls: { confirmUrl: `https://${req.headers.host}/api/linepay/confirm`, cancelUrl: `https://${req.headers.host}/?cancel=1` }
    }
    const resp = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LINE-ChannelId': channelId, 'X-LINE-ChannelSecret': channelSecret }, body: JSON.stringify(body) })
    const data = await resp.json()
    if(data.returnCode === '0000' && data.info && data.info.paymentUrl){
      return res.json({ paymentUrl: data.info.paymentUrl.web, transactionId: data.info.transactionId, raw: data })
    } else {
      return res.json({ error: 'LINE Pay API error', raw: data })
    }
  }catch(e){ return res.status(500).json({ error: e.message }) }
}
