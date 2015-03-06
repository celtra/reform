SelectBoxAbstract = require "./selectbox_abstract"

class SelectBox extends SelectBoxAbstract
    constructor: (@select, options) ->
        @options = $.extend {
            reformClass : 'reform-selectbox'
            uiClass     : 'reform-selectbox-ui'
        }, options

        super @select, @options

    createItemContent: ($option) ->
        # jQuery.html() uses innerHTML to do native html escaping
        $('<div/>').text($option.text()).html()

    createClosedItem: ->
        # Automatically choose a title
        selected = @orig.find('option').filter(-> @selected and $(@).data('count-option') isnt 'no')
        plural = @orig.data 'plural'

        if plural? and selected.length > 1
            title = "#{selected.length} #{plural}"
        else
            title = selected.map(-> $('<div/>').text($(@).text()).html()).get().join ', '
        
        title = @orig.attr 'title' unless title
        title = 'Select' unless title?

        title

module.exports = SelectBox