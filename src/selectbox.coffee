SelectBoxAbstract = require "./selectbox_abstract"

class SelectBox extends SelectBoxAbstract
    constructor: (@select, options) ->
        @options = $.extend {
            reformClass : 'reform-selectbox'
            uiClass     : 'reform-selectbox-ui'
        }, options

        super @select, @options

    createItemContent: ($option) ->
        $('<div/>').text($option.text()).html()

    createClosedItem: ->
        # Automatically choose a title
        selected = @orig.find('option').filter(-> @selected and $(@).data('count-option') isnt 'no')
        plural = @orig.data 'plural'
        title = if plural? and selected.length > 1 then "#{selected.length} #{plural}" else selected.map(-> $(@).text()).get().join ', '
        title = @orig.attr 'title' unless title
        title = 'Select' unless title?

        title

module.exports = SelectBox