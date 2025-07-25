const crypto = require('crypto');
const axios = require('axios');

// 環境変数
const BOT_SECRET = process.env.BOT_SECRET;
const SERVER_API_CONSUMER_KEY = process.env.SERVER_API_CONSUMER_KEY;
const SERVER_TOKEN = process.env.SERVER_TOKEN;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BOT_ID = process.env.BOT_ID;

// JWT生成関数（簡略化）
function generateJWT() {
  // 実際の実装では、RS256でJWTを生成
  // ここは簡略化されています
  return 'your-jwt-token';
}

// メッセージ送信関数
async function sendMessage(channelId, content) {
  try {
    const jwt = generateJWT();
    const response = await axios.post(
      `https://www.worksapis.com/v1.0/bots/${BOT_ID}/channels/${channelId}/messages`,
      {
        content: {
          type: 'text',
          text: content
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('メッセージ送信エラー:', error);
  }
}

// Webhook検証
function verifySignature(body, signature) {
  if (!BOT_SECRET || !signature) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', BOT_SECRET)
    .update(JSON.stringify(body))
    .digest('base64');
  
  return expectedSignature === signature;
}

// 会話ロジック
function processMessage(messageText) {
  const text = messageText.toLowerCase();
  
  // 簡単な会話パターン
  if (text.includes('こんにちは') || text.includes('hello')) {
    return 'こんにちは！今日はいい天気ですね😊';
  }
  
  if (text.includes('天気')) {
    return '申し訳ございませんが、リアルタイムの天気情報は取得できません。天気予報アプリをご確認ください🌤️';
  }
  
  if (text.includes('時間')) {
    const now = new Date();
    return `現在の時刻は ${now.toLocaleString('ja-JP')} です⏰`;
  }
  
  if (text.includes('ありがとう')) {
    return 'どういたしまして！他にも何かお手伝いできることがあれば、お気軽にお声かけください✨';
  }
  
  if (text.includes('バイバイ') || text.includes('さようなら')) {
    return 'さようなら！また今度お話ししましょう👋';
  }
  
  // デフォルトの応答
  return `「${messageText}」ですね。面白いお話ですね！もっと詳しく教えてください😄`;
}

// Vercel関数のメインハンドラー
module.exports = async (req, res) => {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-works-signature');

  // OPTIONSリクエスト対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GETリクエスト（テスト用）
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Webhook endpoint is working!',
      timestamp: new Date().toISOString()
    });
  }

  // POSTリクエスト（実際のWebhook）
  if (req.method === 'POST') {
    try {
      console.log('Webhook受信:', req.body);
      
      // 署名検証（一時的にスキップ）
      // const signature = req.headers['x-works-signature'];
      // if (!verifySignature(req.body, signature)) {
      //   return res.status(401).json({ error: 'Unauthorized' });
      // }

      const events = req.body.events || [];
      
      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
          const channelId = event.source?.channelId;
          const messageText = event.message.text;
          
          console.log(`受信メッセージ: ${messageText}`);
          
          if (channelId) {
            // 会話処理
            const replyMessage = processMessage(messageText);
            
            // 返信送信
            await sendMessage(channelId, replyMessage);
          }
        }
      }
      
      return res.status(200).json({ status: 'OK' });
    } catch (error) {
      console.error('Webhook処理エラー:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // その他のメソッド
  return res.status(405).json({ error: 'Method Not Allowed' });
};
