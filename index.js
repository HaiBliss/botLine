"use strict";

// Các module sẽ sử dụng
const express = require("express");
const server = express();
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const https = require("https");
const request = require("request");
const qs = require("querystring");
const fs = require("fs");
const e = require("express");

//Các thông tin cơ bản ở phần ĐĂNG KÝ BOT
const APIID = 'jp2aNLuvXSUrj';
const SERVERID = '0a8c2dd4dbfd4c5c88e33966f059dc31';
const CONSUMERKEY = 'cnjEbKf_0uvvBmNER3ui';
const PRIVATEKEY = fs.readFileSync('./private_20220401155810.key');
const BOTNO = 1417079;

server.use(bodyParser.json());

server.listen(process.env.PORT || 3000);

server.get('/', (req, res) => {
    res.send('Hữu Hải, Hello World!');
});

server.post('/callback', (req, res) => {
    res.sendStatus(200);

    const message = req.body.content.text;
    //const roomId = req.body.source.roomId;
    const accountId = req.body.source.accountId;

    getJWT((jwttoken) => {
        getServerToken(jwttoken, (newtoken) => {
            sendMessage(newtoken, accountId, message, req.body);
        });
    });
});

//Tạo JWT Token cho máy chủ LineWorks 
function getJWT(callback){
    const iss = SERVERID;
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + (60 * 60);　//set thời gian JWT Token sử dụng(trong code hiện là 1 giờ)
    const cert = PRIVATEKEY;
    const token = [];
    const jwttoken = jwt.sign({"iss":iss, "iat":iat, "exp":exp}, cert, {algorithm:"RS256"}, (err, jwttoken) => {
        if (!err) {
            callback(jwttoken);
        } else {
            console.log(err);
        }
    });
}

//Sử dụng JWT Token để lấy Access Token thông qua API do LineWorks cung cấp
function getServerToken(jwttoken, callback) {
    const postdata = {
        url: 'https://authapi.worksmobile.com/b/' + APIID + '/server/token',
        headers : {
            'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        form: {
            "grant_type" : encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer"),
            "assertion" : jwttoken
        }
    };
    request.post(postdata, (error, response, body) => {
        if (error) {
            console.log(error);
            callback(error);
        } else {
            const jsonobj = JSON.parse(body);
            const AccessToken = jsonobj.access_token;
            console.log('AccessToken: ' + AccessToken);
            callback(AccessToken);
        }
    });
}

//Gửi tin nhắn tới 1 user nhờ vào API do LineWorks cung cấp
function sendMessage(token, accountId, message, body) {
    console.log(body);
    var content = {};
    if (body.content.type == 'text') {
        content = {
            "type": body.content.type,
            "text":
            "type: " + body.content.type
            + "\ntext: " + message
            + "\naccountId: " + accountId
            + "\nroomId: " +  body.source.roomId
            + "\ncreatedTime : " + body.createdTime
        };       
    } else if (body.content.type == 'sticker') {
        content = {
            // "type": body.content.type,
            // "packageId": body.content.packageId,
            // "stickerId": body.content.stickerId
            "type": "text",
            "text":
            "type: " + body.content.type
            + "\npackageId: " + body.content.packageId
            + "\nstickerId: " + body.content.stickerId
            + "\naccountId: " + accountId
            + "\nroomId: " +  body.source.roomId
            + "\ncreatedTime : " + body.createdTime
        };
    } else {
        content = {
            "type": body.content.type,
            "text":
            "type: " + body.content.type
            + "\naccountId: " + accountId
            + "\nroomId: " +  body.source.roomId
            + "\ncreatedTime : " + body.createdTime
        };     
    }
    const postdata = {
        url: 'https://apis.worksmobile.com/r/'+ APIID +'/message/v1/bot/'+ BOTNO +'/message/push',
        
        headers : {
          'Content-Type' : 'application/json;charset=UTF-8',
          'consumerKey' : CONSUMERKEY,
          'Authorization' : "Bearer " + token
        },
        json: {
            "accountId": "zyyx.vietnam@zyxvietnam",
            "content": content
        }
    };
    request.post(postdata, (error, response, body) => {
        if (error) {
          console.log(error);
        }
        console.log(body);
    });
}
