import * as stock from "./stock.js";
import * as ui from "./ui.js";
import * as webRTCHandler from "./webRTCHandler.js";
import * as constants from "./constants.js";

let socketIO = null;

export const registerSocketEvents = (socket) => {

    socketIO = socket;
    socket.on('connect',()=>{
    

        console.log("successfully connectes to wss socket.io server");
        stock.setSocketId(socket.id);
        ui.updatePersonalCode(socket.id);
    });

    socket.on("pre-offer",(data)=>{
        webRTCHandler.handlePreOffer(data);
    });

    socket.on("pre-offer-answer", (data) =>{
        webRTCHandler.handlePreOfferAnswer(data);
    });

    socket.on("user-hanged-up",() => {
        webRTCHandler.handleConnectedUserHangedUp();
    });

    socket.on("webRTC-signaling",(data) => {
        switch (data.type){
            case constants.webRTCSignaling.OFFER:
                webRTCHandler.handleWebRTCOffer(data);
                break;
            case constants.webRTCSignaling.ANSWER:
                webRTCHandler.handleWebRTCAnswer(data);
                break;
            case  constants.webRTCSignaling.ICE_CANDIDATE:
                webRTCHandler.handleWebRTCCandidate(data);
                break;
            default:
            return;
        }
    });

};


export const sendPreOffer=(data) => {
    console.log("emiting to server pre offer events");
socketIO.emit('pre-offer',data);

};


export const sendPreOfferAnswer = (data) => {
    socketIO.emit("pre-offer-answer",data);
};


export const sendDataUsingWebRTCSignaling = (data) => {
    socketIO.emit("webRTC-signaling",data);
};


export const sendUserHangedUp =(data)=> {
    socketIO.emit("user-hanged-up",data);
};