window.$     ?= require "jquery-commonjs"
SelectBoxBase = require './selectbox_abstract'

class MultilineSelectBox extends SelectBoxBase
    constructor: ($select, options) ->
        @options = $.extend {
            noSelectionText   : 'Select an item'

            reformClass       : 'reform-multilineselectbox'
            uiClass           : 'reform-multilineselectbox-ui'
        }, options

        super $select, @options

    createItemContent: ($option) ->
        $title = $ '<p></p>'
        $title.text $option.text()
        $title.appendTo $itemContent

        $desc = $ '<span></span>'
        $desc.text $option.data('desc')
        $desc.appendTo $itemContent

        $itemContent = $title.add $desc

    createClosedItem: ->
        $selected = @orig.find('option').filter( -> @selected )

        if $selected?
            title = $selected.text()
            desc  = $selected.data('desc')
        else 
            title = @options.noSelectionText

        $title = $ '<p></p>'
        $title.text title

        if desc
            $desc = $ '<span></span>'
            $desc.text desc
            $closedItem = $title.add $desc

        else $closedItem = $title

        $closedItem

module.exports = MultilineSelectBox