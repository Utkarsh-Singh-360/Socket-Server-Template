const fs = require('fs');
const wavefile = require('wavefile');

const jsonData = fs.readFileSync('chunks.json', 'utf8');
const audioChunks = JSON.parse(jsonData);

// Concatenate audio chunks into a single buffer
const audioBuffer = Buffer.concat(audioChunks.map(chunk => Buffer.from(chunk.media.payload, 'base64')));

// Decode mulaw audio to PCM
const pcmData = decodeMuLaw(audioBuffer);

// Create a WaveFile object
const wav = new wavefile.WaveFile();

// Set PCM data and format
wav.fromScratch(1, 8000, '16', audioBuffer);

// Write the WAV file
fs.writeFileSync('output.wav', wav.toBuffer());


// Function to decode mu-law encoded audio data to PCM
function decodeMuLaw(buffer) {
    const pcmData = new Int16Array(buffer.length * 2);
    for (let i = 0; i < buffer.length; i++) {
        let muLaw = buffer[i];
        muLaw = ~muLaw; // invert bits
        const sign = muLaw & 0x80;
        let exponent = (muLaw & 0x70) >> 4;
        let mantissa = muLaw & 0x0F;
        exponent = (exponent << 1) + 1;
        mantissa += 16;
        pcmData[i * 2] = (sign === 0 ? 1 : -1) * (1 << exponent) * (mantissa - 16);
    }
    return pcmData;
}