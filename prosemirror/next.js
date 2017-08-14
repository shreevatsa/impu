const {Schema} = require("prosemirror-model")
const {EditorView} = require("prosemirror-view")
const {EditorState} = require("prosemirror-state")
const history = require("prosemirror-history")
const {keymap} = require("prosemirror-keymap")
// const {inputRules, allInputRules} = require("prosemirror-inputrules")
const {baseKeymap} = require("prosemirror-commands")

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
        schema: trivialSchema,
        plugins: [
            history.history(),
            keymap({
            "Mod-z": history.undo,
            "Mod-Shift-z": history.redo
            }),
            // inputRules({rules: allInputRules}),
            keymap(baseKeymap),
        ],
    }),
})
