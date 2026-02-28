let mediaRecorder;
let audioChunks = [];
let streamRef;

const transcriptBox = document.getElementById("transcriptBox");
const statusText = document.querySelector(".status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

/* =========================
   Detect Meeting Tab
========================= */
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];

  if (!currentTab || !currentTab.url) {
    startBtn.disabled = true;
    statusText.textContent = "Status: Unable to detect tab";
    return;
  }

  const url = currentTab.url;

  if (
    url.includes("meet.google.com") ||
    url.includes("zoom.us") ||
    url.includes("teams.microsoft.com")
  ) {
    startBtn.disabled = false;
    statusText.textContent = "Status: Meeting detected ✅";
  } else {
    startBtn.disabled = true;
    statusText.textContent = "Status: No meeting tab detected ❌";
  }
});

/* =========================
   START RECORDING
========================= */
startBtn.addEventListener("click", () => {
  transcriptBox.innerHTML = "<p><strong>Recording started...</strong></p>";
  statusText.textContent = "Status: Recording... 🎙";

  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    if (!stream) {
      alert("Audio capture failed ❌");
      statusText.textContent = "Status: Capture failed ❌";
      return;
    }

    streamRef = stream;
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start();
  });
});

/* =========================
   STOP RECORDING
========================= */
stopBtn.addEventListener("click", () => {
  if (!mediaRecorder) return;

  mediaRecorder.stop();

  mediaRecorder.onstop = async () => {
    transcriptBox.innerHTML += "<p><strong>Uploading & Transcribing...</strong></p>";
    statusText.textContent = "Status: Processing... ⏳";

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

    // Stop stream safely
    if (streamRef) {
      streamRef.getTracks().forEach(track => track.stop());
      streamRef = null;
    }

    try {
      const response = await fetch("http://localhost:5000/upload-audio", {
        method: "POST",
        body: audioBlob
      });

      const data = await response.json();

      transcriptBox.innerHTML = "";

      if (data.utterances && data.utterances.length > 0) {

        data.utterances.forEach(item => {
          const p = document.createElement("p");

          p.innerHTML = `
            <span class="speaker">
              Speaker ${item.speaker}:
            </span> ${item.text}
          `;

          transcriptBox.appendChild(p);
        });

        transcriptBox.scrollTop = transcriptBox.scrollHeight;
        statusText.textContent = "Status: Completed ✅";

      } else {
        transcriptBox.innerHTML = "<p>No speech detected.</p>";
        statusText.textContent = "Status: No speech found";
      }

    } catch (err) {
      transcriptBox.innerHTML = "<p>Transcription failed ❌</p>";
      statusText.textContent = "Status: Error ❌";
    }

    audioChunks = [];
  };
});