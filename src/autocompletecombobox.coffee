window.$        ?= require "jquery-commonjs"
Autocomplete     = require "./autocomplete"

class AutocompleteCombobox extends Autocomplete
    constructor: (@select, options) ->
        @options = $.extend @options, {
            minChars: 0

            placeholderText     : 'Select an item...'

            autocompleteClass   : 'reform-autocompletecombobox'
            # itemClass:          'reform-autocomplete-item'
            # hoverClass:         'reform-autocomplete-hover'
            # listClass:          'reform-autocomplete-list'
            # floaterClass:       'reform-autocompletecombobox-floater'
            fakeClass           : 'reform-autocompletecombobox-fake'
            # inputClass:         'reform-autocomplete-filter'
            titleClass          : 'reform-autocompletecombobox-selected'
            # overlayClass:       'reform-autocomplete-overlay'
            floaterLabelClass   : 'reform-autocompletecombobox-floaterLabel'
        }
        super @select, @options

        return if !@el
        # return if !@fake

        # $selected = $ '<span></span>'
        # $selected.addClass 'reform-autocompletecombobox-selected'
        # $selected.addClass 'placeholder'
        # $selected.text @options.placeholder

        $title = @createTitle()

        if @options.title?
            $title.text @options.title
            $title.removeClass @options.placeholderClass

        @el.append $title

        # @refreshState()

        # $selected.on 'click', () => 
        #     @open()
        #     @fillOptions()

    handleSelectionChanged: ->
        $title = @el.find 'span'
        $title.text @selectedItem.title
        $title.removeClass @options.placeholderClass

        @setFilterValue ''

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

        if !@selectedItem
            $title.text @options.placeholderText
        else
            $title.text @selectedItem.title

        $title.one 'click', () => @close()

        $title

    open: ->
        super
        # @currentSelection = ''

        $title = @createFloaterLabel()
        $title.insertBefore @list

        @filter = @createFilter()
        # @filter = $ '<input/>' 
        # @filter.attr 'type', 'text'
        # @filter.addClass @options.inputClass
        # @filter.appendTo @floater
        # @filter.val ''
        @filter.insertBefore @list

        # @filter.on "keyup.autocomplete", (e) => @handleKeyDown e

        @filter.focus()
        # $title = $('<span></span>')
        # # if @options.selected then $title.text @options.title  else $selected.text 'Select an item...'
        # $title.text 'Select an item...'

        # $title.appendTo @floater

    # close: ->
    #     super
        # @filter = null

    # setContent: (value, title) ->
    #     super
    #     $selected = @el.find('.' + @options.selectedClass)
    #     $selected.text title
    #     $selected.removeClass 'placeholder' if title.length > 0


    # close: ->
    #     console.log 'should close the floater ...'

module.exports = AutocompleteCombobox