window.$             ?= require "jquery-commonjs"
AutocompleteAbstract  = require "./autocomplete_abstract"

class AutocompleteCombobox extends AutocompleteAbstract
    constructor: (@select, options) ->
        @options = $.extend {
            emptySelectionText  : 'Select an item...'
            emptyText           : 'No results.'

            reformClass         : 'reform-autocompletecombobox'
            uiClass             : 'reform-autocompletecombobox-ui'
            floaterLabelClass   : 'reform-autocomplete-floater-label'
            titleClass          : 'selected-item'
            placeholderClass    : 'placeholder'
        }, options
        
        super @select, @options

        return if !@el

        @filterValue = ''

        $title = @createTitle()

        if @selectedItem.value?
            $title.text @selectedItem.title
            $title.removeClass @options.placeholderClass

        @el.append $title

    handleSelectionChanged: (silent = false)->
        $title = @el.find 'span'
        if @selectedItem.value?
            $title.text @selectedItem.title
            $title.removeClass @options.placeholderClass

        super silent

    refreshState: =>
        for data in @data
            if data.value is @select.value
                @selectedItem = { value: @select.value, title: data.title }
                @handleSelectionChanged(yes)
                break

        super

    createClosed: ->
        $el = super

        $el.on 'click', () => @open()

        $el

    createTitle: ->
        $title = $ '<span></span>'
        $title.addClass @options.titleClass

        if $title.text @options.emptySelectionText?
            $title.addClass @options.placeholderClass
            $title.text @options.emptySelectionText 

        $title

    createFloaterLabel: ->
        $title = $ '<span></span>'
        $title.addClass @options.floaterLabelClass
        
        if @options.showArrows
            $title.addClass @options.arrowUpClass

        if @selectedItem.value
            $title.text @selectedItem.title
        else
            $title.text @options.emptySelectionText

        $title.one 'click', () => @close()

        $title

    createNoResults: ->
        $empty = $ '<div></div>'
        $empty.addClass @options.emptyClass
        $empty.text @options.emptyText

    handleEmptyList: ->
        @list.append @createNoResults()

    open: ->
        super

        $title = @createFloaterLabel()
        $title.insertBefore @list

        @filter = @createFilter()
        @filter.insertBefore @list
        @filter.focus()

module.exports = AutocompleteCombobox