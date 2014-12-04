window.$                     ?= require "jquery-commonjs"
CheckBox                      = require "./checkbox"
SelectBox                     = require "./selectbox"
MultilineSelectBox            = require "./multilineselectbox"
AutocompleteBox               = require "./autocompletebox"
AutocompleteCombobox          = require "./autocompletecombobox"
MultilineAutocompleteCombobox = require "./multilineautocompletecombobox"

# This class does the magic
class Reform
    selectboxList = []
    
    process: (node) ->
        for cls, control of Reform.controls
            for n in $(node).parent().find ".#{cls}"
                if cls in ['reform-selectbox', 'reform-multilineselectbox']
                    select = new control n
                    selectboxList.push select
                else
                    new control n  

    # Process static elements
    observe: ->
        $(document).on 'ready',               => @process 'body'
        $(document).on 'DOMNodeInserted', (e) => @process e.target
        $(window).resize                      => @refresh()

    register: (controlName, controlObj)->
        Reform.controls[controlName] = controlObj

    # reposition floater on window resize
    refresh: ->
        n.positionFloater() for n in selectboxList

# Posible custom controls
Reform.controls =
    'reform-checkbox'                      : CheckBox
    'reform-selectbox'                     : SelectBox
    'reform-multilineselectbox'            : MultilineSelectBox
    'reform-autocompletebox'               : AutocompleteBox
    'reform-autocompletecombobox'          : AutocompleteCombobox
    'reform-multilineautocompletecombobox' : MultilineAutocompleteCombobox

module.exports = Reform