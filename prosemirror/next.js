const {Schema} = require("prosemirror-model")
const {EditorView} = require("prosemirror-view")
const {EditorState} = require("prosemirror-state")
const history = require("prosemirror-history")
const {keymap} = require("prosemirror-keymap")
// const {inputRules, allInputRules} = require("prosemirror-inputrules")
const {baseKeymap} = require("prosemirror-commands")
const {menuBar, blockTypeItem, Dropdown, joinUpItem, liftItem, selectParentNodeItem, undoItem, redoItem} = require("prosemirror-menu")

// Copied(!) from https://github.com/ProseMirror/prosemirror-example-setup/blob/44a2fd4/src/menu.js with some clearly irrelevant bits removed
function buildMenuItems(schema) {
  let r = {}, type
  if (type = schema.marks.strong)
    r.toggleStrong = markItem(type, {title: "Toggle strong style", icon: icons.strong})
  if (type = schema.marks.em)
    r.toggleEm = markItem(type, {title: "Toggle emphasis", icon: icons.em})

  if (type = schema.nodes.bullet_list)
    r.wrapBulletList = wrapListItem(type, {
      title: "Wrap in bullet list",
      icon: icons.bulletList
    })
  if (type = schema.nodes.ordered_list)
    r.wrapOrderedList = wrapListItem(type, {
      title: "Wrap in ordered list",
      icon: icons.orderedList
    })
  if (type = schema.nodes.blockquote)
    r.wrapBlockQuote = wrapItem(type, {
      title: "Wrap in block quote",
      icon: icons.blockquote
    })
  if (type = schema.nodes.paragraph)
    r.makeParagraph = blockTypeItem(type, {
      title: "Change to paragraph",
      label: "Plain"
    })
  if (type = schema.nodes.heading)
    for (let i = 1; i <= 10; i++)
      r["makeHead" + i] = blockTypeItem(type, {
        title: "Change to heading " + i,
        label: "Level " + i,
        attrs: {level: i}
      })
  if (type = schema.nodes.horizontal_rule) {
    let hr = type
    r.insertHorizontalRule = new MenuItem({
      title: "Insert horizontal rule",
      label: "Horizontal rule",
      select(state) { return canInsert(state, hr) },
      run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())) }
    })
  }
  let cut = arr => arr.filter(x => x)
  r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule, r.insertTable]), {label: "Insert"})
  r.typeMenu = new Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new DropdownSubmenu(cut([
    r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
  ]), {label: "Heading"})]), {label: "Type..."})
  let tableItems = cut([r.addRowBefore, r.addRowAfter, r.removeRow, r.addColumnBefore, r.addColumnAfter, r.removeColumn])
  if (tableItems.length)
    r.tableMenu = new Dropdown(tableItems, {label: "Table"})

  r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink]), [r.insertMenu]]
  r.blockMenu = [cut([r.typeMenu, r.tableMenu, r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem,
                      liftItem, selectParentNodeItem])]
  r.fullMenu = r.inlineMenu.concat(r.blockMenu).concat([[undoItem, redoItem]])

  return r
}

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
            // inputRules({rules: allInputRules}), // emDash, ellipsis, smartQuotes -- not worth it?
            keymap(baseKeymap),
            menuBar({floating: true,
                     content: buildMenuItems(trivialSchema).fullMenu}),
        ],
    }),
})
