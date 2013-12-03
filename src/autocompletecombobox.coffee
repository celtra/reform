window.$             ?= require "jquery-commonjs"
AutocompleteAbstract  = require "./autocompleteAbstract"

class AutocompleteCombobox extends AutocompleteAbstract
    constructor: (@select, options) ->
        @options = $.extend @options, {
            placeholderText     : 'Select an item...'

            autocompleteClass   : 'reform-autocompletecombobox'
            fakeClass           : 'reform-autocompletecombobox-fake'
            titleClass          : 'reform-autocompletecombobox-selected'
            floaterLabelClass   : 'reform-autocompletecombobox-floaterLabel'
            emptyClass          : 'reform-autocompletecombobox-empty'
        }
        super @select, @options

        return if !@el

        @filterValue = ''

        $title = @createTitle()

        if @selectedItem.value isnt 0
            $title.text @selectedItem.title
            $title.removeClass @options.placeholderClass

        @el.append $title

    handleSelectionChanged: ->
        $title = @el.find 'span'
        if @selectedItem.value isnt 0
            $title.text @selectedItem.title
            $title.removeClass @options.placeholderClass

        super

    createClosed: ->
        $el = super

        $el.on 'click', () => @open()

        $el

    createTitle: ->
        $title = $ '<span></span>'
        $title.addClass @options.titleClass
        $title.addClass @options.placeholderClass
        $title.text @options.placeholderText 

        $title

    createFloaterLabel: ->
        $title = $ '<span></span>'
        $title.addClass @options.floaterLabelClass
        
        if @options.showArrows
            $title.addClass @options.arrowUpClass

        if @selectedItem.value is 0
            $title.text @options.placeholderText
        else
            $title.text @selectedItem.title

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