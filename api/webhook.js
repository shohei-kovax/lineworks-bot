const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

// 環境変数（Vercelの環境変数で設定）
const BOT_SECRET = process.env.BOT_SECRET;
const SERVER_API_CONSUMER_KEY = process.env.SERVER_API_CONSUMER_KEY;
const SERVER_TOKEN = process.env.SERVER_TOKEN;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// JWT生成関数
function generateJWT() {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: SERVER_API_CONSUMER_KEY,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1時間
  };

  // 実際の実装では、RS256でJWTを生成
  // ここは簡略化されています
  return 'your-jwt-token';
}

// メッセージ送信関数
async function sendMessage(channelId, content) {
  try {
    const jwt = generateJWT();
    const response = await axios.post(
      `https://www.worksapis.com/v1.0/bots/${process.env.BOT_ID}/channels/${channelId}/messages`,
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

// Webhookエンドポイント
app.post('/api/webhook', async (req, res) => {
  try {
    // 署名検証
    const signature = req.headers['x-works-signature'];
    if (!verifySignature(req.body, signature)) {
      return res.status(401).send('Unauthorized');
    }

    const events = req.body.events;
    
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const channelId = event.source.channelId;
        const messageText = event.message.text;
        
        console.log(`受信メッセージ: ${messageText}`);
        
        // 会話処理
        const replyMessage = processMessage(messageText);
        
        // 返信送信
        await sendMessage(channelId, replyMessage);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook処理エラー:', error);
    res.status(500).send('Internal Server Error');
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Vercel用のexport
module.exports = app;

// ローカル開発用
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
