$        ?= require "jquery-commonjs"
CheckBox  = require "./checkbox"
SelectBox = require "./selectbox"

# This class does the magic
class Reform
    process: (node) ->
        (new control n for n in $(node).parent().find ":not(.#{cls}-fake) > .#{cls}") for cls, control of Reform.controls
    
    # Process static elements
    observe: ->
        $(document).on "ready",               => @process "body"
        $(document).on "DOMNodeInserted", (e) => @process e.target
    
# Posible custom controls
Reform.controls =
    "reform-checkbox"  : CheckBox
    "reform-selectbox" : SelectBox

module.exports = Reform