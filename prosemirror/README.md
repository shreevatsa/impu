# Structured editing in the browser with Prosemirror

[ProseMirror](http://prosemirror.net/) (by the author of [CodeMirror](https://codemirror.net/)) lets you have documents that conform to a particular structure.

There are these parts:

- Schema: What can the document's structure be? E.g. "a document is a bunch of headings each followed by paragraphs and blockquotes; a paragraph can contain text that can be bold and/or italic", etc. ProseMirror already comes with a few schema you can use as examples, including "the set of documents expressible in Markdown".

- State: The actual state of the editor. (What the document contains, where the cursor is, what is selected, etc.) The content must match the schema.

- View: What the user actually sees (and interacts with), in their browser.

- DOMParser (parseDOM) / toDom: How to go from an element in a View to a State (that fits the Schema).

# Example

Consider a document with the following "trivial schema". (Actually a truly "trivial schema" would probably mean an empty doc, so what is called `trivialSchema` below is really the simplest *nontrivial* schema.)

`trivial.html`:

    <!doctype html>
    <style>.ProseMirror { background: silver }</style>
    <body>
      The editor is the box that appears below. Try pasting stuff into it.
      <script src="trivial_bundle.js"></script>
    </body>

`trivial.js`:

    const {Schema} = require("prosemirror-model")
    const {EditorView} = require("prosemirror-view")
    const {EditorState} = require("prosemirror-state")

    const trivialSchema = new Schema({
        nodes: {
            doc: {content: "paragraph+"},
            paragraph: {
                content: "text*",
                toDOM: () => ["p", 0],
            },
            text: {inline: true},
        }
    })

    window.view = new EditorView(document.body, {
        state: EditorState.create({
            schema: trivialSchema
        }),
    })

After

    ~/local/bin/browserify trivial.js --outfile trivial_bundle.js
