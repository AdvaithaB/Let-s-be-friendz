import * as wss from "./wss.js";
import * as constants from"./constants.js";
import * as ui from "./ui.js";
import * as stock from"./stock.js";

let connectedUserDetails;

let peerConnection;

let dataChannel;


const defaultConstraints= {
    audio:true,
    video:true
};


const configuration = {
    iceServer : [
        {
            urls:"stun:stun.1.google.com.13902"
        }
    ]
}


export const getLocalPreview = () => {
    navigator.mediaDevices
    .getUserMedia(defaultConstraints)
    .then((stream) => {
        ui.updateLocalVideo(stream);
        ui.showVideoCallButtons();
        stock.setCallState(constants.callState.CALL_AVAILABLE);
        stock.setLocalStream(stream);
    })
    .catch((err) => {
        console.log("error occured while accessing camera");
        console.log(err);
    });
};

const createPeerConnection = () => {
    peerConnection = new RTCPeerConnection(configuration);
    
    dataChannel = peerConnection.createDataChannel("chat");

    peerConnection.ondatachannel = (event) => {
        const dataChannel = event.channel;

        dataChannel.onopen = () => {
            console.log("peer connection is read to receive data channel messages");

        }

        dataChannel.onmessage = (event)=> {
            console.log("message came from data channel");
            const message = JSON.parse(event.data);
            ui.appendMessage(message);
        };
    };

    peerConnection.onicecandidate = (event) => {
        console.log("getting ice candidates from stun server");
        if(event.candidate){
            //send ice to other peer
            wss.sendDataUsingWebRTCSignaling({
                connectedUserSocketId: connectedUserDetails.socketId,
                type:constants.webRTCSignaling.ICE_CANDIDATE,
                candidate:event.candidate,
            });
        }
    };

    peerConnection.onconnectionstatechange = (event) => {
        if(peerConnection.connection === "connected"){
            console.log("successfully connected with other peer");
        }
    }

    //receiving tracks

    const remoteStream = new MediaStream();
    stock.setRemoteStream(remoteStream);
    ui.updateRemoteVideo(remoteStream);

    peerConnection.ontrack = (event) => {
        remoteStream.addTrack(event.track);
    }

    //add our stream to peer connection

    if(connectedUserDetails.callType=== constants.callType.PERSONAL_VIDEO){
        const localStream = stock.getState().localStream;

        for(const track of localStream.getTracks()){
            peerConnection.addTrack(track,localStream);
        }
    }
};

export const sendMessageUsingDataChannel=(message)=> {
    const stringifiedMessage = JSON.stringify(message);
    dataChannel.send(stringifiedMessage);
}


export const sendPreOffer=(callType,calleePersonalCode)=>{
    connectedUserDetails={
        callType,
        socketId:calleePersonalCode
    }
    

    if(callType===constants.callType.PERSONAL_CHAT || callType===constants.callType.PERSONAL_VIDEO){

        const data={
            callType,
            calleePersonalCode
        };
        ui.showCallingDialog(callingDialogRejectCallHander);
        stock.setCallState(constants.callState.CALL_UNAVAILABLE);
        wss.sendPreOffer(data);
    }
    
   
};

export const handlePreOffer = (data) => {
   const{callType,callerSocketId} = data;

  
   if(!checkCallPossibility()) {
       return sendPreOfferAnswer(constants.preOfferAnswer.CALL_UNAVAILABLE,callerSocketId);
   }

   connectedUserDetails={
    socketId:callerSocketId,
    callType,
};


   stock.setCallState(constants.callState.CALL_UNAVAILABLE);

   if(
       callType===constants.callType.PERSONAL_CHAT || callType === constants.callType.PERSONAL_VIDEO
   ){

       ui.showIncomingCallDialog(callType,acceptCallHandler,rejectCallHandler);
   }
};

const acceptCallHandler = () => {
    console.log("call accepted");
    createPeerConnection();
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_ACCEPTED);
    ui.showCallElements(connectedUserDetails.callType);
};

const rejectCallHandler = () => {
    console.log("call rejected");
    sendPreOfferAnswer();
    setIncomingCallsAvailable();
    sendPreOfferAnswer(constants.preOfferAnswer.CALL_REJECTED);
};


const callingDialogRejectCallHander = () => {
   const data ={
       connectedUserSocketId: connectedUserDetails.socketId,
   };
   closePeerConnectionAndResetState();
   wss.sendUserHangedUp(data);
};

const sendPreOfferAnswer = (preOfferAnswer,callerSocketId=null)=> {
    const socketId = callerSocketId? callerSocketId:connectedUserDetails.socketId;
    const data ={
        callerSocketId:socketId,
        preOfferAnswer,
    };
    ui.removeAllDialogs();
    wss.sendPreOfferAnswer(data);
};


export const handlePreOfferAnswer = (data) => {
    const {preOfferAnswer } = data;
    ui.removeAllDialogs();
    if(preOfferAnswer===constants.preOfferAnswer.CALLEE_NOT_FOUND){
        ui.showInfoDialog(preOfferAnswer);
        setIncomingCallsAvailable();

    }
    
    if(preOfferAnswer===constants.preOfferAnswer.CALL_UNAVAILABLE){
        ui.showInfoDialog(preOfferAnswer);
        setIncomingCallsAvailable();

    }

    if(preOfferAnswer===constants.preOfferAnswer.CALL_REJECTED){
        setIncomingCallsAvailable();
        ui.showInfoDialog(preOfferAnswer);

    }

    if(preOfferAnswer===constants.preOfferAnswer.CALL_ACCEPTED){
       ui.showCallElements(connectedUserDetails.callType);
       createPeerConnection();
       sendWebRTCOffer();
    }
};

const sendWebRTCOffer =async() => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    wss.sendDataUsingWebRTCSignaling({
        connectedUserSocketId: connectedUserDetails.socketId,
        type:constants.webRTCSignaling.OFFER,
        offer:offer,
    });

};

export const handleWebRTCOffer = async(data) => {
    await peerConnection.setRemoteDescription(data.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    wss.sendDataUsingWebRTCSignaling({
    connectedUserSocketId : connectedUserDetails.socketId,
    type: constants.webRTCSignaling.ANSWER,
    answer: answer,

});
};

export const handleWebRTCAnswer = async(data) => {
    console.log("handling webRTC answer");
    await peerConnection.setRemoteDescription(data.answer);
};

export const handleWebRTCCandidate = async(data) => {
    try{
        await peerConnection.addIceCandidate(data.candidate);
    } catch(err) {
        console.log("error occured when trying to add recieved ice candidate",err);
    }
};

let screenSharingStream;

export const switchBetweenCameraAndScreenSharing = async(screenSharingActive) => {
    if(screenSharingActive){
        const localStream = stock.getState().localStream;
        const senders = peerConnection.getSenders();

        const sender = senders.find((sender) => {
            return(sender.track.kind === localStream.getVideoTracks()[0].kind);
        });

        if(sender) {
            sender.replaceTrack(localStream.getVideoTracks()[0]);
        }

        //stop screen sharing stream

        stock.getState().screenSharingStream.getTracks().forEach((track) =>track.stop());
            
    

        stock.setScreenSharingActive(!screenSharingActive);

        ui.updateLocalVideo(localStream);

    }
    else{
        console.log("switching for screen sharing");
        try{
            screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
            video:true
            });


            stock.setScreenSharingStream(screenSharingStream);
            //replace track which sender is sending

            const senders = peerConnection.getSenders();

            const sender = senders.find((sender) => {
                return(sender.track.kind === screenSharingStream.getVideoTracks()[0].kind);
            });

            if(sender) {
                sender.replaceTrack(screenSharingStream.getVideoTracks()[0]);
            }

            stock.setScreenSharingActive(!screenSharingActive);

            ui.updateLocalVideo(screenSharingStream);
        } catch(err){
            console.error("error occured when trying to access screen sharing",err
            );

        }
    }
};

// hang up

export const handleHangUp = ()=> {
    const data = {
        connectedUserSocketId:connectedUserDetails.socketId
    };

    wss.sendUserHangedUp(data);
    closePeerConnectionAndResetState();
};


export const handleConnectedUserHangedUp = () => {
    closePeerConnectionAndResetState();
};

const closePeerConnectionAndResetState = () => {
    if(peerConnection){
        peerConnection.close();
        peerConnection= null;
    }

    //active mic and camera

    if(connectedUserDetails.callType === constants.callType.PERSONAL_VIDEO)
    {
        stock.getState().localStream.getVideoTracks()[0].enabled = true;
        stock.getState().localStream.getAudioTracks()[0].enabled = true;

       
    }

    ui.updateUIAfterHangUp(connectedUserDetails.callType);
    setIncomingCallsAvailable();
    connectedUserDetails = null;
};

const checkCallPossibility = (callType) => {
    const callState = stock.getState().callState;

    if(callState===constants.callState.CALL_AVAILABLE){
        return true;
    }
    if((callType===constants.callType.personalCode)&& callState===constants.callState.CALL_AVAILABLE_ONLY_CHAT){
        return false;
    }

    return false;
};

const setIncomingCallsAvailable = () => {
    const localStream = stock.getState().localStream;
    if(localStream){
        stock.setCallState(constants.callState.CALL_AVAILABLE);
    } else{
        stock.setCallState(constants.callState.CALL_AVAILABLE_ONLY_CHAT);
    }
}