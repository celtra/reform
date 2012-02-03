# Modify Element to trigger DOMAttrModified when setAttribute is called (workaround for WebKit)
# Idea came from Sean Hogan here: http://stackoverflow.com/a/2370755
Element.prototype._setAttribute = Element.prototype.setAttribute
Element.prototype.setAttribute = (name, val) ->
    e = document.createEvent "MutationEvents"
    prev = this.getAttribute name
    @_setAttribute name, val
    e.initMutationEvent "DOMAttrModified", true, true, null, prev, val, name, 2
    @dispatchEvent e