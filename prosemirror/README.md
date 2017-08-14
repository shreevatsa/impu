# Structured editing in the browser with Prosemirror

[ProseMirror](http://prosemirror.net/) (by the author of [CodeMirror](https://codemirror.net/)) lets you have documents that conform to a particular structure.

There are these parts:

- Schema: What can the document's structure be? E.g. "a document is a bunch of headings each followed by paragraphs and blockquotes; a paragraph can contain text that can be bold and/or italic", etc. ProseMirror already comes with a few schema you can use as examples, including "the set of documents expressible in Markdown".

- State: The actual state of the editor. (What the document contains, where the cursor is, what is selected, etc.) The content must (will) match the schema.

- View: What the user actually sees (and interacts with), in their browser.

- DOMParser (parseDOM) / toDom: How to go from an element in a View to a State (that fits the Schema).

# Example

Consider a document with the following "trivial schema". (Actually, a truly "trivial schema" would probably mean an empty doc, so what is called `trivialSchema` below is really the [simplest nontrivial](http://sites.math.rutgers.edu/~zeilberg/Opinion65.html) schema.)

`trivial.html`:

    <!doctype html>
    <style>.ProseMirror { background: silver; min-height: 80vh; }</style>
    <body>
      The editor is the box that appears below. Try typing words or pasting multiple paragraphs of stuff into it.
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

After these steps (from [here](http://prosemirror.net/docs/guides/basics/))

    npm install prosemirror-model prosemirror-view prosemirror-state
    npm install -g browserify
    ~/local/bin/browserify trivial.js --outfile trivial_bundle.js

it results in the following webpage:

<p align="center"><iframe src="trivial.html" style="height: 60vh; min-width: 80vw;"></iframe></p>

Try it out!

From Javascript (or the browser console), you can get the document contents with `window.view.state.doc.content.toJSON()`

# Next steps

After a few minutes of playing with the above, you may notice a few problems:

- There is no way to enter new paragraphs, apart from pasting them in.

- Related: If you make a paragraph empty by deleting all the text in it, there is no way to delete the paragraph itself.

- It would be nice to have a richer schema (headings, bold, ... ?) and a correspondingly richer view, more editor features like undo, etc.

Let's look at these, in a random order:

- Adding undo is documented in the ProseMirror docs, so it turns out to be quite easy to do: see commit 3c6f86ae6f214232ac7c75e720971b3c7ea59695 which basically adds

        plugins: [history.history(), keymap({"Mod-z": history.undo})]

- Let's make it possible to hit Enter to start a new paragraph: see 7c58f8c2f3fabb6cd8fc9b76265a1a9527725eca which adds `keymap(baseKeymap)` to `plugins`, which is defined in [prosemirror-commands](https://github.com/ProseMirror/prosemirror-commands/blob/52b3a1baddf4bb3f956ceb43b4000d4bc44c049b/src/commands.js). This is a bunch of commonsensical actions for individual keystrokes that users expect anyway.

- Let's add a menu for usability (which will gain more entries as we update our schema): see commit a9eeb748402ea087b0e774875637bba93f69573b.

- Making schema richer by adding headings: see bd4819dc72276ee069b0dbed41d2dbe2318ae1e2

- Adding footnotes to schema: see 42eacbefc49e05053e6c3a46b7a17a4b71d7855f and 6c7811f52593365f98571b07438760a7b2854e4d

Next steps:

- Allow saving the doc to some cloud storage (Firebase?) (Not going to bother with the colloborative editing feature, and will instead just require users to not edit simultaneously.)

- (Additionally) show all the footnotes at the end, to make them easier to see. Also should be able to jump from footnote to main text.

- Show a table of contents / outline, to jump to specific sections.
