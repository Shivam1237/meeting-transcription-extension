const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const Transcript = require("./models/Transcript");

const app = express();
app.use(cors());
app.use(express.json());

/* MongoDB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Error ❌", err));

/* Upload Full Audio */
app.post("/upload-audio", (req, res) => {

  const filePath = path.join(__dirname, "audio.webm");
  const writeStream = fs.createWriteStream(filePath);

  req.pipe(writeStream);

  writeStream.on("finish", async () => {
    try {

      console.log("Audio received ✅");

      const audioData = fs.readFileSync(filePath);

      // Upload to AssemblyAI
      const uploadResponse = await axios.post(
        "https://api.assemblyai.com/v2/upload",
        audioData,
        {
          headers: {
            authorization: process.env.ASSEMBLY_API_KEY,
            "content-type": "application/octet-stream"
          }
        }
      );

      const audioUrl = uploadResponse.data.upload_url;

      // Start transcription
      const transcriptResponse = await axios.post(
        "https://api.assemblyai.com/v2/transcript",
        {
          audio_url: audioUrl,
          speech_models: ["universal-2"],
          speaker_labels: true
        },
        {
          headers: {
            authorization: process.env.ASSEMBLY_API_KEY,
            "content-type": "application/json"
          }
        }
      );

      const transcriptId = transcriptResponse.data.id;

      console.log("Transcription ID:", transcriptId);

      // Poll for result
      let transcriptResult;

      while (true) {
        const pollingResponse = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: {
              authorization: process.env.ASSEMBLY_API_KEY
            }
          }
        );

        transcriptResult = pollingResponse.data;

        if (transcriptResult.status === "completed") break;

        if (transcriptResult.status === "error")
          throw new Error("Transcription failed");

        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      console.log("Transcription completed ✅");

      // Save to MongoDB
      if (transcriptResult.utterances) {
        for (const item of transcriptResult.utterances) {
          await new Transcript({
            speaker: item.speaker,
            text: item.text
          }).save();
        }
      }

      res.json({
        utterances: transcriptResult.utterances
      });

      fs.unlinkSync(filePath);

    } catch (error) {
      console.log("Error ❌", error.message);
      res.status(500).json({ message: "Transcription failed" });
    }
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});