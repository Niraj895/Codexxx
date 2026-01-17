require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const DOWNLOAD_DIR = "./downloads";
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

function convertToMp4(input, output) {
  return new Promise((resolve, reject) => {
    const cmd = `ffmpeg -i "${input}" -c:v libx264 -c:a aac -preset fast -movflags +faststart "${output}" -y`;
    exec(cmd, (err) => (err ? reject(err) : resolve()));
  });
}

async function handleFile(msg, file, fileName) {
  const chatId = msg.chat.id;
  const ext = path.extname(fileName).toLowerCase();

  await bot.sendMessage(chatId, "⏳ Processing video...");

  const filePath = await bot.downloadFile(file.file_id, DOWNLOAD_DIR);
  let finalPath = filePath;

  if (ext !== ".mp4") {
    const mp4Path = filePath.replace(ext, ".mp4");
    await convertToMp4(filePath, mp4Path);
    finalPath = mp4Path;
  }

  const sent = await bot.sendVideo(chatId, finalPath);

  fs.unlinkSync(filePath);
  if (finalPath !== filePath) fs.unlinkSync(finalPath);

  const newFileId = sent.video.file_id;
  const link = `${process.env.PLAYER_DOMAIN}/?id=${newFileId}`;

  await bot.sendMessage(chatId, link, {
    disable_web_page_preview: false
  });
}

bot.on("video", (msg) => {
  handleFile(msg, msg.video, "video.mp4");
});

bot.on("document", (msg) => {
  handleFile(msg, msg.document, msg.document.file_name);
});

console.log("✅ MDisk-style Telegram bot running");
