window.$ 	   		    ?= require "jquery-commonjs"
CheckBox             = require "./checkbox"
SelectBox            = require "./selectbox"
MultilineSelectBox   = require "./multilineselectbox"
AutocompleteBox      = require "./autocompletebox"
AutocompleteCombobox = require "./autocompletecombobox"

# This class does the magic
class Reform
    process: (node) ->
        (new control n for n in $(node).parent().find ".#{cls}") for cls, control of Reform.controls

    # Process static elements
    observe: ->
        $(document).on "ready",               => @process "body"
        $(document).on "DOMNodeInserted", (e) => @process e.target

    register: (controlName, controlObj)->
        Reform.controls[controlName] = controlObj

# Posible custom controls
Reform.controls =
    "reform-checkbox"             : CheckBox
    "reform-selectbox"            : SelectBox
    "reform-multilineselectbox"   : MultilineSelectBox
    "reform-autocompletebox"      : AutocompleteBox
    "reform-autocompletecombobox" : AutocompleteCombobox

module.exports = Reform