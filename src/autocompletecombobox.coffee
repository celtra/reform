window.$        ?= require "jquery-commonjs"
Autocomplete     = require "./autocomplete"

class AutocompleteCombobox extends Autocomplete
    constructor: (@select, options) ->
        @options = $.extend @options, {
            placeholderText     : 'Select an item...'

            autocompleteClass   : 'reform-autocompletecombobox'
            fakeClass           : 'reform-autocompletecombobox-fake'
            titleClass          : 'reform-autocompletecombobox-selected'
            floaterLabelClass   : 'reform-autocompletecombobox-floaterLabel'
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

    createTitle: ->
        $title = $ '<span></span>'
        $title.addClass @options.titleClass
        $title.addClass @options.placeholderClass
        $title.text @options.placeholderText 

        $title.on 'click', () => @open()

        $title

    createFloaterLabel: ->
        $title = $ '<span></span>'
        $title.addClass @options.floaterLabelClass
        $title.addClass @options.arrowUpClass

        if @selectedItem.value is 0
            $title.text @options.placeholderText
        else
            $title.text @selectedItem.title

        $title.one 'click', () => @close()

        $title

    open: ->
        super

        $title = @createFloaterLabel()
        $title.insertBefore @list

        @filter = @createFilter()
        @filter.insertBefore @list
        @filter.focus()

module.exports = AutocompleteCombobox