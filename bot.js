//--------------------------------------------------------------
//
// Discord TTS BOT by VOICEVOX
//
//--------------------------------------------------------------

//--------------------------------------------------------------
//ライブラリインポート
//--------------------------------------------------------------
//環境変数ライブラリ
require('dotenv').config();
//音声合成(HOYA)ライブラリ
const {VoiceText} = require('voice-text');

//HTTP通信ライブラリ
//const axios  = require("axios");
//ファイル保存＆削除ライブラリ
const fs = require("fs");
//Discordライブラリ
const Discord = require('discord.js');

//--------------------------------------------------------------
//Discord初期化
//--------------------------------------------------------------
const discordClient = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL'] ,
                                          messageCacheMaxSize: 20, 
                                          messageSweepInterval: 30});

//--------------------------------------------------------------
//prefix環境変数読込
//--------------------------------------------------------------
let prefix = process.env.PREFIX;

//--------------------------------------------------------------
//環境変数読込
//--------------------------------------------------------------
//BOTトークン
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
//VOICE_TEXTトークン
const voiceText = new VoiceText(process.env.VOICE_TEXT_TOKEN);

//--------------------------------------------------------------
//チャンネル環境変数読込
//--------------------------------------------------------------
//読み上げ用 
const ChannelId = process.env.VOICE_TEXT_CHANNEL_ID;

//--------------------------------------------------------------
//各種モード
//--------------------------------------------------------------
//VCモード
var vcMode = false;

//--------------------------------------------------------------
//ボイステーブル
//--------------------------------------------------------------
const VoiceTable = ['hikari', 'haruka', 'takeru', 'santa', 'bear', 'show'];
//ユーザーボイス変数
var userVoice = {};

//--------------------------------------------------------------
//VOICEVOX用http通信オブジェクト
//--------------------------------------------------------------
//const rpc = axios.create({ baseURL: process.env.VOICEVOX_ENGINE, proxy: false });

//--------------------------------------------------------------
//VOICEVOX用ボイス変更テーブル
//--------------------------------------------------------------
//const VoiceTableVOICEVOX = ['0:四国めたん', '1:ずんだもん'];
//ユーザーボイス変数
//var userVoiceVOICEVOX = {};

//--------------------------------------------------------------
//音声変換キュー変数
//--------------------------------------------------------------
let queueVT = [];
//let queueVV = [];
let isPlaying = false;
const voiceDataDir = "voice_data"

//--------------------------------------------------------------
//声変更関数(HOYA)
//--------------------------------------------------------------
function getVoiceByUserVT(id) {
  if (id in userVoice) {
      return userVoice[id];
  };

  //デフォはharuka固定
  var voice = VoiceTable[1];
  userVoice[id] = voice;
  return voice;
}

//--------------------------------------------------------------
//音声変換関数(HOYA)
//--------------------------------------------------------------
function getYomiageVT(obj,id,ch) {

  //デバッグ
  //console.log(`msg:${obj.msg}`);
  //console.log(`voice:${obj.voice}`);

  //テキスト⇒音声ストリーム
  let body = Buffer.from('');
  voiceText.stream(obj.msg + '<vt_pause=250/>', {speaker: obj.voice ,format: 'ogg' })
  .on('data', (chunk) => {
    //Bufferに変換
    body = Buffer.concat([body, new Buffer.from(chunk)]);
  })
  .on('end', () => {
    //Bufferを書き出す
    fs.writeFileSync(voiceDataDir + "/" + `voiceVT_${id}.ogg`, body);
    //キューセット　
    addAudioToQueueVT(voiceDataDir + "/" + `voiceVT_${id}.ogg`, ch)
    //再生
    if(!isPlaying){
      playAudioVT();
    }
  });
}

//--------------------------------------------------------------
//音声データをキューへ追加(HOYA)
//--------------------------------------------------------------
function addAudioToQueueVT(voiceFile, voiceChannel) {
  queueVT.push(
      {voiceFile: voiceFile, voiceChannel: voiceChannel }
  );
  console.log("Add queue! queueIdx:" + (queueVT.length - 1)  + " Add voice_file:" + voiceFile);
}

//--------------------------------------------------------------
//キューの順番で音声処理(HOYA)
//--------------------------------------------------------------
function playAudioVT() {
  if (queueVT.length >= 1) {
      isPlaying = true
      queueVT[0].voiceChannel.join().then(connection => {
        const dispatcher = connection.play(queueVT[0].voiceFile,{ volume: false });
        dispatcher.on('finish', () => {
            console.log("Done queue! queueIdx:" + (queueVT.length - 1)  + " Done voice_file:" + queueVT[0].voiceFile);
            fs.unlinkSync(queueVT[0].voiceFile);
            queueVT.shift();
            playAudioVT();
        })
      })      
  }else {
    isPlaying = false
  }
}


//--------------------------------------------------------------
//メイン処理
//--------------------------------------------------------------
(async function main() {

  //--------------------------------------------------------------
  //ディスコードトークンが設定されているか？
  //--------------------------------------------------------------
  if(BOT_TOKEN == undefined){
    console.log('DISCORD_BOT_TOKENが未設定');
    process.exit(0);
  };

  //--------------------------------------------------------------
  //discordログイン
  //--------------------------------------------------------------
  discordClient.login(BOT_TOKEN);
   
  //--------------------------------------------------------------
  //Bot準備
  //--------------------------------------------------------------
  discordClient.once('ready', () => {
    console.log("Discord connection successful!!");
    console.log("Discord Bot ready!!");
    return ;
  });

  //--------------------------------------------------------------
  // テキストメッセージ受信時のイベント
  //--------------------------------------------------------------
  discordClient.on('message', async (message) => {
                     
    //--------------------------------------------------------------
    // チェンネルチェック
    //--------------------------------------------------------------
    if (message.channel.id !== ChannelId) { 
      //設定したチャンネルID以外は処理しない
      console.log("チャンネルIDが異なるので以降の読み上げ処理はしません");
      return; 
    }
     
    //--------------------------------------------------------------
    // 発言メッセージの送信者チェック
    //--------------------------------------------------------------
    if (message.author.id == discordClient.user.id || message.author.bot){
      //メッセージ送信者がBOT自身なら無視
      return;
    }
        
    //--------------------------------------------------------------
    // 起動コマンド
    //--------------------------------------------------------------
    const [commandJoin, ...argsJoin] = message.content.split(' ')
    if (commandJoin === `${prefix}vtjoin`) {
      //デバック
      console.log('ユーザーID message.author.id ' + message.author.id );
      console.log('BOT ID discordClient.user.id ' + discordClient.user.id);
      console.log('ユーザの参加VC member.voice.channel ' + message.member.voice.channel);
      //ボイスチャンネルチェック
      if(message.member.voice.channel === null){
        //メッセージ送信 
        message.guild.channels.cache.get(ChannelId).send(message.author.username + `はボイスチャンネルに参加してないよ！\n` +
                                                                                    `BOTを召喚する時は、ボイスチャンネルに参加してから「${prefix}vtjoin」コマンドを打ってね！\n`+
                                                                                    `自分がボイスチャンネルに参加する時は、ボイスチャンネルのタイトルをクリック、または、タップしてね！`);
        console.log('コマンドを打ったユーザーがVCに接続していいないのでJOIN処理を終了します');
        return;
      }
        //デバック
        console.log('BOTがVCに接続していいないのでJOIN処理を続行します');
        //メッセージ送信 
        message.guild.channels.cache.get(ChannelId).send("VCに参加中・・・")
        // ボイスチャンネルに接続
        message.member.voice.channel.join().then(connection => {

          //接続時のメッセージ表示
          message.guild.channels.cache.get(ChannelId).send(`☆VCに参加成功☆\n` +
                                                            `---------------------------\n` +
                                                            `●接続先サーバー：` + message.guild.name + `\n` +
                                                            `●接続先ボイスチャンネル：` + message.member.voice.channel.name + `\n` +
                                                            `●読み上げ対象チャンネル：` + message.channel.name + `\n` +
                                                            `---コマンド一覧-------------\n` +
                                                            `●VC参加　${prefix}vtjoin\n` +
                                                            `●VC退出　${prefix}vtbye\n` +
                                                            `●読み上げOFF　${prefix}readoff\n` +
                                                            `●読み上げON　${prefix}readon\n` +
                                                            `●声の変更　${prefix}vtvoice [番号]\n ` +
                                                            `　例：hikariに変更する場合「 ${prefix}vtvoice 0 」\n` + 
                                                            `●声リスト\n` +
                                                            `　0:hikari(ひかりちゃん)\n` +
                                                            `　1:haruka(はるかちゃん)\n` +
                                                            `　2:takeru(たける)\n` +
                                                            `　3:santa(サンタ)\n` +
                                                            `　4:bear(クマ)\n` +
                                                            `　5:show(ショウくん))\n` +
                                                            `---------------------------\n`
                                                            );
          //読み上げモードON
          vcMode = true;
          console.log('接続サーバー:' + message.guild.name);
          console.log('接続ボイスチャンネル:' + message.member.voice.channel.name);
          console.log('読み上げ対象チャンネル:' + message.channel.name);
          console.log('ボイスチャンネルに参加成功!');    
          return;                                         
        });
            
    }
    
    //--------------------------------------------------------------
    // 終了コマンド
    //--------------------------------------------------------------
    const [commandBye, ...argsBye] = message.content.split(' ')
    if (commandBye === `${prefix}vtbye`){
      if(discordClient.voice.connections.get(message.guild.id) === undefined){  
        console.log('BOTがVCにいないので退出しません');  
        return;   
      }else{
        //切断
        discordClient.voice.connections.get(message.guild.id).disconnect();  
        //読み上げモードOFF
        vcMode = false;
        //退出メッセージ送信
        message.guild.channels.cache.get(ChannelId).send(":dash:");
        console.log('ボイスチャンネルから退出しました');  
        return;
      }
    }
    
    //--------------------------------------------------------------
    // 読み上げONコマンド
    //--------------------------------------------------------------          
    const [commandReadon, ...argsReadon] = message.content.split(' ')
    if (commandReadon === `${prefix}readon`){  
      if(discordClient.voice.connections.get(message.guild.id) === undefined){
        console.log('BOTがVCにいないのでreadonしません');
        return;
      }
      //読み上げ設定ONにする
      if(vcMode === false){           
        vcMode = true;           
        message.guild.channels.cache.get(ChannelId).send('読み上げ設定ONにしました。読み上げします。');        
        console.log('読み上げON');               
      }else{
        message.channel.send('読み上げ設定はONです。');           
      }  
      return;
    }

    //--------------------------------------------------------------
    // 読み上げOFFコマンド
    //--------------------------------------------------------------    
    const [commandReadoff, ...argsReadReadoff] = message.content.split(' ')
    if (commandReadoff === `${prefix}readoff`){    
      if(discordClient.voice.connections.get(message.guild.id) === undefined){
        console.log('BOTがVCにいないのでreadoffしません');
        return;
      }
      //読み上げ設定OFFにする
      if(vcMode === true){ 
        vcMode = false; 
        message.guild.channels.cache.get(ChannelId).send('読み上げ設定OFFにしました。読み上げしません。');
        console.log('読み上げOFF');       
      }else{
        message.channel.send('読み上げ設定はOFFです。');
      }  
      return;        
    }

    //--------------------------------------------------------------
    // ボイス変更設定コマンド
    //--------------------------------------------------------------    
    const [commandVoice, ...argsVoice] = message.content.split(' ')
    if (commandVoice === `${prefix}vtvoice`){
      if(discordClient.voice.connections.get(message.guild.id) === undefined){
        console.log('BOTがVCにいないのでvoice変更しません');
        return;
      }else{
        //コマンド後のメッセージ分解
        const [...VoiceMsg] = argsVoice;
        if(Number(VoiceMsg[0]) > 6 || Number(VoiceMsg[0]) < 0){
          message.guild.channels.cache.get(ChannelId).send("声の設定は0～5の間で設定してね。");
          console.log('vtvoice設定コマンドが不正(設定範囲外)');
          return;
        }
        //Voice取得 
        userVoice[message.author.id] = VoiceTable[VoiceMsg[0]];          
        if(userVoice[message.author.id] === undefined){
          message.guild.channels.cache.get(ChannelId).send("声の設定は0～5の間で設定してね。");
          console.log('vtvoice設定コマンドが不正(不正な値)');
          return;
        }
        //voice変更メッセージ送信   
        message.guild.channels.cache.get(ChannelId).send(message.author.username + "の声を" + userVoice[message.author.id] + "に変更したよ。");
        console.log(message.author.username + "の声を" + userVoice[message.author.id] + "に変更");         
        return;
      }                
    }


    //--------------------------------------------------------------
    // 読み上げ
    //--------------------------------------------------------------
    //読み上げ設定OFFの場合は読み上げしない    
    if(vcMode === false){  return;  }
    if(discordClient.voice.connections.get(message.guild.id) === undefined){
      console.log('BOTがVCにいないので読み上げしません');
      return;  
    } 
    //メッセージの加工
    const text = message.content
                        .replace(/https?:\/\/\S+/g, '')  // URLを除去
                        .replace(/<a?:.*?:\d+>/g, '')    // カスタム絵文字を除去
                        .replace( /[~!"#\$%&'\(\)\*\+,\-\.\/:;<=>\?@\[\\\]\^_`\{\|\}]/g,'') //記号を除去
                        .replace('vtjoin','')
                        .replace('vtbye','')
                        .replace('vtvoice','')
                        .replace('readon','')
                        .replace('readoff',''); 
    // テキストが空なら読み上げしない 
    if(!text) { return; } 
    //メッセージのボイスチャンネルがあったら読み上げする
    if (message.member.voice.channel) {  
      
        try{
            // ボイス設定
            var voice = getVoiceByUserVT(message.author.id)
            //テキスト⇒音声ストリーム
            getYomiageVT({voice: voice,msg: text},message.id,message.member.voice.channel)
        }catch(err){
          console.error('例外エラーが発生:' + err.message);
          return;
        }

    }else{
        console.log('BOTがVCにいないので読み上げしません');
    }
  });
       
})().catch((e) => console.error(e));




