const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const myCameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    myCameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}
async function getMedia(myDeviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" }
  };
  const cameraConstrains = {
    audio: true,
    video: { deviceId: { exact: myDeviceId } }
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      myDeviceId ? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!myDeviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}
getMedia();

function handleMuteBtnClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "소리 켜기";
    muted = true;
  } else {
    muteBtn.innerText = "음소거";
    muted = false;
  }
}

function handleCameraBtnClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "CAMERA OFF";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "CAMERA ON";
    cameraOff = true;
  }
}
async function handleCameraChange() {
  await getMedia(camerasSelect.value);
}
muteBtn.addEventListener("click", handleMuteBtnClick);
cameraBtn.addEventListener("click", handleCameraBtnClick);
camerasSelect.addEventListener("input", handleCameraChange);
