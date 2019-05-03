const accountSid = "AC5a26208a5f441bd327c99d030c689d81";
const authToken = "e1330741500786b043f69ed7593d4f53";
const client = require("twilio")(accountSid, authToken);

client.messages
  .create({
    body: "Time to start cooking!",
    from: "+13214246421",
    to: "+14077901234"
  })
  .then(message => console.log("message sent!"));
