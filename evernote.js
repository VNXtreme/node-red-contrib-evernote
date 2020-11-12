var Evernote = require("evernote");
var isDev = false;

module.exports = function (RED) {
  function EvernoteNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.on("input", function (msg) {
      if (!node.credentials || !node.credentials.accessToken) {
        node.status({ fill: "red", shape: "dot", text: "box.warn.no-credentials" });
        // node.error(RED._("box.error.no-filename-specified"));
        return;
      }

      // msg.payload = msg.payload.toLowerCase();
      // // console.log("this.credentials", this.credentials);
      // node.send(msg);
    });
  }
  RED.nodes.registerType("evernote-credentials", EvernoteNode, {
    credentials: {
      displayName: { type: "text" },
      clientKey: { type: "text" },
      clientSecret: { type: "text" },
      oauthToken: { type: "text" },
      accessToken: { type: "text" },
    },
  });

  RED.httpAdmin.get("/evernote/auth", function (req, res) {
    let credentialId = req.query.id;
    let clientKey = req.query.clientKey;
    let clientSecret = req.query.clientSecret;
    let clientOrigin = req.query.callback;

    // initialize OAuth
    var client = new Evernote.Client({
      consumerKey: clientKey,
      consumerSecret: clientSecret,
      sandbox: isDev, // change to false when you are ready to switch to production
      china: false, // change to true if you wish to connect to YXBJ - most of you won't
    });
    var callbackUrl = clientOrigin + "?id=" + credentialId; // your endpoint

    client.getRequestToken(callbackUrl, function (error, oauthToken, oauthTokenSecret) {
      if (error) {
        // do your error handling here
        console.log("error");
        res.send(RED._("box.error.no-credentials"));
        return false;
      }

      // store your token here somewhere - for this example we use req.session
      // req.session.oauthToken = oauthToken;
      var credentials = RED.nodes.getCredentials(credentialId) || {};

      credentials.displayName = clientKey;
      credentials.clientKey = clientKey;
      credentials.clientSecret = clientSecret;
      credentials.oauthToken = oauthToken;
      credentials.oauthTokenSecret = oauthTokenSecret;

      res.redirect(client.getAuthorizeUrl(oauthToken)); // send the user to Evernote
      RED.nodes.addCredentials(credentialId, credentials);
    });
  });

  RED.httpAdmin.get("/evernote/auth_callback", function (req, res) {
    if (req.query.reason === "token_expired") {
      return res.send(RED._("evernote.error.token_expired", { error: req.query.reason, description: req.query.reason }));
    }

    var credentialId = req.query.id,
      oauthToken = req.query.oauth_token,
      oauthVerifier = req.query.oauth_verifier;
    var credentials = RED.nodes.getCredentials(credentialId);

    var client = new Evernote.Client({
      consumerKey: credentials.clientKey,
      consumerSecret: credentials.clientSecret,
      sandbox: isDev,
      china: false,
    });

    client.getAccessToken(oauthToken, credentials.oauthTokenSecret, oauthVerifier, function (error, accessToken, oauthTokenSecret, results) {
      if (error) {
        // do your error handling
        console.log("error getAccessToken");
        return res.send(RED._("evernote.error.something-broken"));
      }
      console.log("authenticated accessToken", accessToken);

      // delete credentials.oauthToken;
      // delete credentials.callback;

      credentials.accessToken = accessToken;
      console.log("credentialscredentialscredentialscredentials", credentialId, credentials);

      RED.nodes.addCredentials(credentialId, credentials);
      res.send(RED._("evernote.message.authorized"));
    });
  });
};
