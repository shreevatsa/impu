See [Collaborative real-time editor](https://en.wikipedia.org/wiki/Collaborative_real-time_editor) on Wikipedia. Things like:

- Google docs
- ShareLaTeX / Overleaf / Authorea
- Dropbox Paper / Hackpad / Etherpad
- Firepad https://firepad.io/
- Socrates
- Scratchpad (uses Ace + Firebase)
- Coderpad (uses CodeMirror + Firebase)

https://groups.google.com/forum/#!topic/firepad-io/zrvhL1qPL6Y

etc.

(Because the "pad" seems a popular suffix, I'm calling this "foopad" until I figure out a better name.)

The idea is:

- libraries like CodeMirror and Ace (see also https://en.wikipedia.org/wiki/Comparison_of_JavaScript-based_source_code_editors) make it easy to have an editable text in a browser window, with syntax highlighting etc.,

- Firebase lets you actually save the data so that it is not in purely the user's browser.

Firepad is an example, and socrates.io is another -- firepad says scorates.io is built on top of firepad, but as far as I can tell the latter just uses firebase directly, doesn't use firepad. Anyway, this is what will let us do collaboration: the diffs getting sent between teh two users, being saved somewhere in teh ccloud securely, etc.

# Idea

This is the idea:

## Saving

As you type text, the product (app? software?) will keep your last few edits,then an exponential backoff of older diffs. Say every 10 minutes for last 2 days, then only daily versions (or hourly) for say a year, etc.

I should be able to download and view diff, and upload the changed version back. And when I upload the changed version it should compute only the diff and not register it as a zillion actions.

For peace of mind, the page should have a "download" button, an explicit "save" button, a prominent box that shows "last saved <X> ago", etc.

## Editor

The editor itself should have a minimal syntax highlighting suitable for what I want: # and ## for sections, maybe @ for the title at the top, `** ... **` for bold, and newlines become paragraph breaks (others are wrapped).

It should also have input method -- either you can input Devanagari directly, or you can say get-text-and-transliterate.

# Plan

-- look at examples, and get basic shared-doc functionality working: doesn't have to have syntax highlithting or anything.

-- once it's working (and even the periodic saves are working), change to better syntax highlighting: line breaks become paragraphs, section and bold are highlighted, etc.

# Examples

## Scratchpad
Use Ace + Firebase

https://news.ycombinator.com/item?id=4933800
> Basically on keyup I ship the whole contents of the editor and the cursor position to firebase. I'm also keeping track of all the active connections to a scratchpad document so I know who is typing. Anytime the code changes on the server, it triggers a callback function on each client that will update the contents of the textarea. If someone else is typing, the document is locked so only 1 person can type at a time. This way I can avoid all the potential merge conflicting type things that can happen.

https://gist.github.com/dergachev/4322317

# v1

MVP (really minimal):

- Amma visits https://shreevatsa.github.io/impu/v1.html#QWERTYUIOP

- The JS on the page talks to firebase and gets the latest content corresponding to QWERTYUIOP

- Populates it into a textarea
  (actually, probably best to have it be a minimal ace editor: https://stackoverflow.com/questions/1600398/large-text-in-textarea-freezes-computer)

- As she edits it, the JS is running on the page. Every few minutes it takes the content and puts it on Firebase.

Ok, so structure of the data:

    /docs/<doc_id>/<version_id>/ {contents: contents, timestamp: timestamp}
