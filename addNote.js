var Evernote = require("evernote");

module.exports = function (RED) {
  "use strict";
  function addNote(n) {
    RED.nodes.createNode(this, n);

    let { credentials } = RED.nodes.getNode(n.evernote);
    console.log(!credentials, !credentials.accessToken);
    console.log(credentials);
    if (!credentials || !credentials.accessToken) {
      this.status({ fill: "red", shape: "ring", text: "evernote.warn.no-access-token" });
      return;
    }

    let node = this;

    node.on("input", function (msg) {
      let client = new Evernote.Client({ token: credentials.accessToken });

      var noteStore = client.getNoteStore();

      noteStore
        .listNotebooks()
        .then(function (notebooks) {
          notebooks;
          // console.log("notebooks", notebooks[1].guid);
          makeNote(noteStore, "test add note", "content body", notebooks[1])
        })
        .catch((err) => {
          console.log("err", err);
          node.error(RED._("evernote.error.get-notebook"));
          node.status({ fill: "red", shape: "ring", text: "evernote.error.get-notebook" });
          return;
        });
    });
  }
  RED.nodes.registerType("addNote", addNote);

  function makeNote(noteStore, noteTitle, noteBody, parentNotebook) {
    var nBody = '<?xml version="1.0" encoding="UTF-8"?>';
    nBody += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
    nBody += "<en-note>" + noteBody + "</en-note>";

    // Create note object
    var ourNote = new Evernote.Types.Note();
    ourNote.title = noteTitle;
    ourNote.content = nBody;

    // parentNotebook is optional; if omitted, default notebook is used
    if (parentNotebook && parentNotebook.guid) {
      ourNote.notebookGuid = parentNotebook.guid;
    }

    // Attempt to create note in Evernote account (returns a Promise)
    noteStore
      .createNote(ourNote)
      .then(function (note) {
        // Do something with `note`
        console.log(note);
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
};
