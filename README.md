# Discord-TTS-Bot-VoiceTextWebAPI
Discord.jsで作成したDiscordの読み上げBOTです。
<br>
音声エンジンに[HOYA VoiceText Web API ](https://cloud.voicetext.jp/webapi)を使っています。
<br>
適当にセルフホストして自由に利用してください。
<br>
Windows10 Pro上で作ったので、Windows10 Proしか動作保証しません。

## 環境構築手順

### node.jsの準備

Node.js v16.6.2以降をダウンロードして、インストールしてください。


### Bot実行の準備

Node.jsで使うパッケージを準備  
```
npm install
```  
※package.jsonがあるディレクトリで実行して下さい。

### HOYA VoiceText Web APIの準備

[HOYA VoiceText Web API ](https://cloud.voicetext.jp/webapi)ので無料利用登録を行って、
<br>
VoiceTextAPIのトークンを取得してください。

### Botトークンの取得とenv設定

BotトークンをDiscord Developer Portalから取得してください。ここでは取得方法は省略します。
<br>
.env_sampleを.envにリネームして、中身を下記のように修正してください。
```
# Environment Config
PREFIX=!
DISCORD_BOT_TOKEN=ボットのトークン
VOICE_TEXT_CHANNEL_ID=読み上げしたいテキストチャンネルのID
VOICE_TEXT_TOKEN=VoiceTextAPIのトークン
``` 
※VOICE_TEXT_TOKENに無料利用登録で取得したトークンを設定して下さい

### BOTの起動

bot.jsがあるフォルダに移動して、コマンドプロンプトで下記を入力して下さい。
```
node bot.js
``` 


### BOTコマンド

| コマンド             | 説明                                                                                           |
|---------------------|------------------------------------------------------------------------------------------------|
| !vtjoin             | 自分がボイスチャンネル入っている状態で入力すると、BOTがボイスチャンネルに入室します。                  |
| !vtbye              | BOTがボイスチャンネルから退出します。                                                              |
| !readoff            | BOTの読み上げをOFFにします。 ※他の読み上げBOTが入っている時に、読み上げが被らないようにする時などに利用|
| !readon             | BOTの読み上げをONにします。  ※読み上げを再開したい時に利用                                    　　 |
| !vtvoice            | BOTの声を変更します。[0～5]の範囲　                                                               |

| 声リスト      | 声のタイプ          |
| 0            | hikari(ひかりちゃん) |
| 1            | haruka(はるかちゃん) |
| 2            | takeru(たける)      |
| 3            | santa(サンタ)       |
| 4            | bear(クマ)          |
| 5            | show(ショウくん)     |



