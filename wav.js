const fs = require("fs").promises;
const path = require("path");
const { deleteFile } = require("./utility/createFile");
const WaveFile = require("wavefile").WaveFile;

 async function readFileSyncFn(fileName) {
  try {
    const jsonData = await fs.readFile(`${fileName}.json`, "utf8");

    const audioChunks = JSON.parse(jsonData);
    const audioBuffer = Buffer.concat(
      audioChunks.filter(chunk => chunk?.media?.payload).map((chunk) => Buffer.from(chunk?.media?.payload, "base64"))
    );
  
    const wav = new WaveFile();
    wav.fromScratch(1, 8000, "8", audioBuffer);
    wav.fromMuLaw();
    wav.toSampleRate(16000);
    const results = wav.toBuffer();
    return fs.writeFile(`./${fileName}.wav`, results);
  } catch (error) {
    console.log("Error While Reading File Chunk",error)
    return;
  }
 
}

module.exports = {readFileSyncFn}
