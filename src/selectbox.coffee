SelectBoxBase = require './selectbox_abstract'

class SelectBox extends SelectBoxBase
    constructor: (@select, options) ->
        @options = $.extend {
            reformClass : 'reform-selectbox'
            uiClass     : 'reform-selectbox-ui'
        }, options

        super @select, @options

    createItemContent: ($option) ->
        $option.text()

    createClosedItem: ->
        # Automatically choose a title
        selected = @orig.find("option").filter(-> @selected and $(@).data("count-option") isnt "no")
        plural = @orig.data "plural"
        title = if plural? and selected.length > 1 then "#{selected.length} #{plural}" else selected.map(-> $(@).text()).get().join ", "
        title = @orig.attr "title" unless title
        title = "Select" unless title?

        title

module.exports = SelectBox