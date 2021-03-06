node-red-contrib-evernote
=====================================

[Node-RED](http://nodered.org) nodes for [Evernote](https://evernote.com/).

## Installation

    npm install node-red-contrib-evernote
or

    yarn add node-red-contrib-evernote

## Evernote Credentials

Each of the nodes made available through this package will communicate with the Evernote API.  These interactions must be performed securely and require authentication information to be passed.

Each credential defined as a Node-RED secret has the following properties:


| Property    | Type     | 
| ----------- | -------- | 
| **clientKey**    | `string` |
| **clientSecret** | `string` |

The API keys can be acquired from the [Evernote Developer Documentation](https://dev.evernote.com/doc/). Once achieved, go to the [Support Resources](https://dev.evernote.com/support/) to active your API key for production. This process of activation will take 1-2 business days and you will receive an email notification.
NOTE: these nodes only work with production API keys only.

## The Evernote Node-RED nodes

The set of Node-RED nodes are found in the section of the palette.  The current set of nodes are:

* evernote-credentials - Register your credential.
* addNote - Add note to your notebook.