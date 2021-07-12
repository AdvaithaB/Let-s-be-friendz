
import * as constants from "./constants.js";
import * as elements from "./elements.js";

export const updatePersonalCode=(personalCode)=> {
    const personalCodeParagraph=document.getElementById("personal_code_paragraph");

    personalCodeParagraph.innerHTML=personalCode;
};



export const updateLocalVideo = (stream) => {
    const localVideo = document.getElementById("local_video");
    localVideo.srcObject = stream;

    localVideo.addEventListener("loadedmetadata",() => {
        localVideo.play();
    });
};

export const showVideoCallButtons = () => {
    const personalCodeVideoButton = document.getElementById("personal_code_video_button");

    showElement(personalCodeVideoButton);
}

export const updateRemoteVideo = (stream) => {
    const remoteVideo = document.getElementById("remote_video");
    remoteVideo.srcObject=stream;
}

export const showIncomingCallDialog = (
    callType,
    acceptCallHandler,
    rejectCallHandler 
    )=> {
    const callTypeInfo= callType === constants.callType.PERSONAL_CHAT? "Chat" : "Video";
    const incomingCallDialog = elements.getIncomingCallDialog(callTypeInfo,acceptCallHandler,rejectCallHandler);
   

    const dialog = document.getElementById("dialog");
    dialog.querySelectorAll('*').forEach((dialog)=>dialog.remove());
    dialog.appendChild(incomingCallDialog);
};


export const showCallingDialog = (rejectCallHandler) => {

    const callingDialog = elements.getCallingDialog(rejectCallHandler);

    const dialog = document.getElementById("dialog");
    dialog.querySelectorAll('*').forEach((dialog)=>dialog.remove());
    dialog.appendChild(callingDialog);
};

export const showInfoDialog = (preOfferAnswer) => {
    let infoDialog = null;
    if(preOfferAnswer === constants.preOfferAnswer.CALL_REJECTED){
        infoDialog = elements.getInfoDialog(
            "Call rejected",
            "Callee rejected the call"
        );
    }

    if(preOfferAnswer === constants.preOfferAnswer.CALLEE_NOT_FOUND){
        infoDialog = elements.getInfoDialog(
            "Callee not found",
            "Please check the code"
        );
    }

    if(preOfferAnswer === constants.preOfferAnswer.CALL_UNAVAILABLE){
        infoDialog = elements.getInfoDialog(
            "Call is not possible",
            "Probably calle is busy, please try again later"
        );
    }

    if(infoDialog){
        const dialog = document.getElementById("dialog");
        dialog.appendChild(infoDialog);

        setTimeout( () => {
            removeAllDialogs();
        }, [4000]);
        
    }
};

export const removeAllDialogs = () => {
    const dialog = document.getElementById("dialog");
    dialog.querySelectorAll("*").forEach((dialog)=>dialog.remove());
};


export const showCallElements = (callType)=> {
    if(callType===constants.callType.PERSONAL_CHAT) {
        showChatCallElements();
    }

    if(callType===constants.callType.PERSONAL_VIDEO){
        showVideoCallElements();
    }
};

const showChatCallElements =  () => {
    const finishConnectionChatButtonContainer = document.getElementById("finish_chat_button_container");
  
  
  showElement(finishConnectionChatButtonContainer);

  const newMessageInput = document.getElementById("new_message");
  showElement(newMessageInput);
  disableDashboard();
};




const showVideoCallElements = () => {

    const callButtons =document.getElementById("call_buttons");
    showElement(callButtons);

    const placeHolder = document.getElementById("video_placeholder");
    hideElement(placeHolder);

    const remoteVideo = document.getElementById("remote_video");
    showElement(remoteVideo);

    const newMessageInput = document.getElementById("new_message");
    showElement(newMessageInput);

    disableDashboard();
};
//ui call buttons

const micOnImgSrc = "./utils/images/mic.png";
const micOffImgSrc = "./utils/images/micOff.png";

export const updateMicButton = (micActive)=> {
    const micButtonImage= document.getElementById("mic_button_image");
    micButtonImage.src = micActive?micOffImgSrc : micOnImgSrc;
}

const cameraOnImgSrc= "./utils/images/camera.png";
const cameraOffImgSrc="./utils/images/cameraOff.png";

export const updateCameraButton = (cameraActive) => {
    const cameraBUttonImage = document.getElementById("camera_button_image");
    cameraBUttonImage.src=cameraActive? cameraOffImgSrc:cameraOnImgSrc;
};


//ui messages

export const appendMessage = (message,right = false)=> {
    const messagesContainer = document.getElementById("messages_container");
    const messageElement = right?elements.getRightMessage(message): elements.getLeftMessage(message);
    messagesContainer.appendChild(messageElement);
};

export const clearMessenger = () => {
    const messagesContainer = document.getElementById("messages_container");
    messagesContainer.querySelectorAll('*').forEach((n)=> n.remove());
};

//recording

export const showRecordingPanel = () => {
    const recordingButtons = document.getElementById("video_recording_buttons");
    showElement(recordingButtons);

//hide start recording button if it is active
    const startRecordingButton = document.getElementById("start_recording_button");
    hideElement(startRecordingButton);
};

export const resetRecordingButtons = ()=> {
    const startRecordingButton = document.getElementById("start_recording_button");
    const recordingButtons = document.getElementById("start_recording_button");
    

    hideElement(recordingButtons);
    showElement(startRecordingButton);
};

//ui after hang up

export const updateUIAfterHangUp = (callType) => {
    enableDashboard();

    if(callType === constants.callType.PERSONAL_VIDEO){
        const callButtons = document.getElementById("call_buttons");
        hideElement(callButtons);
    }

    else{
        const chatCallButtons=document.getElementById("finish_chat_button_contaner");
        hideElement(chatCallButtons);
    }
   const newMessageInput = document.getElementById("new_message");
   hideElement(newMessageInput);
   clearMessenger();
   

   updateMicButton(false);
   updateCameraButton(false);

   //hide remote video and show placeholder

   const remoteVideo = document.getElementById("remote_video");
   hideElement(remoteVideo);

   const placeholder = document.getElementById("video_placeholder");
   showElement(placeholder);

   

   removeAllDialogs();

};


//ui helper functions

const enableDashboard = ()=> {
    const dashboardBlocker = document.getElementById("dashboard_blur");
    if(!dashboardBlocker.classList.contains("display_none")){
        dashboardBlocker.classList.add("display_none");
    }
};

const disableDashboard= () => {
    const dashboardBlocker = document.getElementById("dashboard_blur");
    if(dashboardBlocker.classList.contains("display_none")) {
        dashboardBlocker.classList.remove("display_none");
    }
};


const hideElement = (element) => {
    if(!element.classList.contains("display_none")){
        element.classList.add("display_none");
    }
};

const showElement = (element) => {
    if(element.classList.contains("display_none")) {
        element.classList.remove("display_none");
    }
};

