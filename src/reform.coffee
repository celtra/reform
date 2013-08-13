window.$ 	   		?= require "jquery-commonjs"
CheckBox  			= require "./checkbox"
SelectBox 			= require "./selectbox"
AutocompleteBox 	= require "./autocompletebox"
GeoAutocompleteBox 	= require "./geoautocompletebox"

# This class does the magic
class Reform
    process: (node) ->
        (new control n for n in $(node).parent().find ".#{cls}") for cls, control of Reform.controls
    
    # Process static elements
    observe: ->
        $(document).on "ready",               => @process "body"
        $(document).on "DOMNodeInserted", (e) => @process e.target
    
    AutocompleteBox: AutocompleteBox
    GeoAutocompleteBox: GeoAutocompleteBox

# Posible custom controls
Reform.controls =
    "reform-checkbox"  			: CheckBox
    "reform-selectbox" 			: SelectBox

module.exports = Reform
