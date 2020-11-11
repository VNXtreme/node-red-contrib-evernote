var Evernote = require("evernote");
var crypto = require("crypto");
var fileType = require("file-type");

module.exports = function (RED) {
  "use strict";
  function addNote(n) {
    RED.nodes.createNode(this, n);
    this.evernote = RED.nodes.getNode(n.evernote);
    let { credentials } = this.evernote;
    if (!credentials || !credentials.accessToken) {
      this.status({ fill: "red", shape: "ring", text: "evernote.warn.no-access-token" });
      return;
    }
    let client = new Evernote.Client({ token: credentials.accessToken });
    let noteStore = client.getNoteStore();
    let node = this;
    
    node.on("input", async function (msg) {
      let selectedNotebook = n.notebooks;
      let title = msg.title || n.title || "";
      let content = msg.payload || "";
      let resources = await getResources(msg.buffer);

      try {
        makeNote(noteStore, title, content, resources, selectedNotebook, node);
      } catch (error) {
        node.error(RED._("evernote.error.get-notebook"));
        node.status({ fill: "red", shape: "ring", text: "evernote.error.get-notebook" });
      }
    });
  }
  RED.nodes.registerType("addNote", addNote);

  async function getResources(imageBuffer) {
    if (!imageBuffer) return [];

    let file = await fileType.fromBuffer(imageBuffer);
    return [
      {
        mime: file.mime,
        data: {
          body: imageBuffer,
        },
      },
    ];
  }

  function makeNote(noteStore, noteTitle, noteBody, resources, parentNotebook, node) {
    // Create note object
    var ourNote = new Evernote.Types.Note();

    ourNote.title = noteTitle;

    // Build body of note
    var nBody = '<?xml version="1.0" encoding="UTF-8"?>';
    nBody += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
    nBody += "<en-note>" + noteBody;

    if (resources && resources.length > 0) {
      // Add Resource objects to note body
      nBody += "<br /><br />";
      ourNote.resources = resources;
      for (let i in resources) {
        var md5 = crypto.createHash("md5");
        md5.update(resources[i].data.body);
        var hexhash = md5.digest("hex");
        nBody += '<br /><en-media type="' + resources[i].mime + '" hash="' + hexhash + '" /><br />';
      }
    }


    nBody += "</en-note>";
    ourNote.content = nBody;

    // parentNotebook is optional; if omitted, default notebook is used
    if (parentNotebook) {
      ourNote.notebookGuid  = parentNotebook;
    }
console.log('ourNote', ourNote);
    // Attempt to create note in Evernote account
    noteStore
      .createNote(ourNote)
      .then(function (note) {
        // Do something with `note`
        node.send(note);
        node.status({ fill: "green", shape: "ring", text: "Note created" });
      })
      .catch(function (err) {
        // Something was wrong with the note data
        // See EDAMErrorCode enumeration for error code explanation
        // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
        console.log(err);
        node.error(RED._("evernote.error.add-note"));
        node.status({ fill: "red", shape: "ring", text: "evernote.error.add-note" });
      });
  }

  RED.httpAdmin.get("/get-notebooks", function (req, res) {
    let credentialId = req.query.id;
    let { evernote } = RED.nodes.getNode(credentialId);
    let client = new Evernote.Client({ token: evernote.credentials.accessToken });
    var noteStore = client.getNoteStore();

    noteStore
      .listNotebooks()
      .then(function (notebooks) {
        res.json(notebooks);
      })
      .catch((err) => {
        node.error(RED._("evernote.error.get-notebook"));
        node.status({ fill: "red", shape: "ring", text: "evernote.error.get-notebook" });
      });
  });
};
