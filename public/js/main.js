import * as stock from "./stock.js";
import * as wss from "./wss.js";
import * as webRTCHandler from"./webRTCHandler.js";
import * as constants from "./constants.js";
import * as ui from "./ui.js";
import * as recordingUtils from"./recordingUtils.js";

const socket = io('/');
wss.registerSocketEvents(socket);


webRTCHandler.getLocalPreview();


const personalCodeCopyButton=document.getElementById("personal_code_copy_button");
personalCodeCopyButton.addEventListener('click',() =>{
   const personalCode= stock.getState().socketId;
   navigator.clipboard && navigator.clipboard.writeText(personalCode);
});

const personalCodeChatButton=document.getElementById("personal_code_chat_button");

const personalCodeVideoButton=document.getElementById("personal_code_video_button");

personalCodeChatButton.addEventListener("click" ,()=>{
    console.log("chat button clicked");

const calleePersonalCode = document.getElementById("personal_code_input").value;
const callType=constants.callType.PERSONAL_CHAT;

    webRTCHandler.sendPreOffer(callType,calleePersonalCode);
});


personalCodeVideoButton.addEventListener("click" ,()=>{
    console.log("video button clicked");

    const calleePersonalCode = document.getElementById("personal_code_input").value;
    const callType=constants.callType.PERSONAL_VIDEO;

    webRTCHandler.sendPreOffer(callType,calleePersonalCode);
});

//event listeners for video call button

const micButton = document.getElementById("mic_button");
micButton.addEventListener("click",() => {
    const localStream = stock.getState().localStream;
    const micEnabled = localStream.getAudioTracks()[0].enabled;
    localStream.getAudioTracks()[0].enabled = !micEnabled;
    ui.updateMicButton(micEnabled);
});


const cameraButton = document.getElementById("camera_button");
cameraButton.addEventListener("click",()=>{
    const localStream = stock.getState().localStream;
    const cameraEnabled= localStream.getVideoTracks()[0].enabled;
    localStream.getVideoTracks()[0].enabled = !cameraEnabled;
    ui.updateCameraButton(cameraEnabled);
});

const switchForScreenSharingButton = document.getElementById("screen_sharing_button");
    switchForScreenSharingButton.addEventListener("click",()=> {
    const screenSharingActive = stock.getState().screenSharingActive;
    webRTCHandler.switchBetweenCameraAndScreenSharing(screenSharingActive);
});

//messenger


const newMessageInput = document.getElementById("new_message_input");
newMessageInput.addEventListener('keydown',(event)=>{
    console.log("change occured");
    const key = event.key;

    if(key==="Enter"){
        webRTCHandler.sendMessageUsingDataChannel(event.target.value);
        ui.appendMessage(event.target.value,true);
        newMessageInput.value="";
    }
});

const sendMessageButton = document.getElementById("send_message_button");
sendMessageButton.addEventListener("click", () => {
    const message = newMessageInput.value;
    webRTCHandler.sendMessageUsingDataChannel(message);
    ui.appendMessage(message,true);
    newMessageInput.value="";
});


//recording

const startRecordingButton = document.getElementById("start_recording_button");
startRecordingButton.addEventListener("click", ()=>{
    recordingUtils.startRecording();
    ui.showRecordingPanel();
});


const stopRecordingButton = document.getElementById("stop_recording_button");
stopRecordingButton.addEventListener("click",()=>{
    recordingUtils.stopRecording();
    ui.resetRecordingButtons();
});

//hang up

const hangUpButton = document.getElementById("hang_up_button");
hangUpButton.addEventListener('click', () => {
    webRTCHandler.handleHangUp();
});

const hangUpChatButton = document.getElementById("finish_chat_call_button");
hangUpChatButton.addEventListener('click', () => {
    webRTCHandler.handleHangUp();
});
