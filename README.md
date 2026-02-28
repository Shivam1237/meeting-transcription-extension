# 🎙 Meeting Transcription Chrome Extension

A Chrome Extension that captures meeting audio, performs multi-speaker transcription using AssemblyAI, and stores structured transcripts in MongoDB.

## 🚀 Features

- Detect active meeting tab (Google Meet / Zoom / Teams)
- Start & Stop recording
- Speaker-wise transcription
- MongoDB storage
- Clean UI

## 🛠 Tech Stack

Frontend:
- Chrome Extension (Manifest V3)

Backend:
- Node.js
- Express.js
- MongoDB
- AssemblyAI API

## ⚙ Setup Instructions

1. Clone repository
2. Install backend dependencies:
   npm install
3. Add .env file:
   MONGO_URI=your_mongo_uri
   ASSEMBLY_API_KEY=your_api_key
4. Run backend:
   node server.js
5. Load extension in Chrome:
   chrome://extensions → Load Unpacked → select extension folder

## 📂 Project Structure

extension/
backend/

## 🎯 Author
Shivam Prajapati
