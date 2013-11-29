window.$        ?= require "jquery-commonjs"
Autocomplete     = require "./autocomplete"

class AutocompleteCombobox extends Autocomplete
    constructor: (@select, options) ->
        @options = $.extend @options, {
            minChars: 0

            placeholder:        'Select an item...'

            autocompleteClass:  'reform-autocompletecombobox'
            itemClass:          'reform-autocompletecombobox-item'
            hoverClass:         'reform-autocompletecombobox-hover'
            listClass:          'reform-autocompletecombobox-list'
            optionsClass:       'reform-autocompletecombobox-floater'
            fakeClass:          'reform-autocompletecombobox-fake'
            inputClass:         'reform-autocompletecombobox-input'
            selectedClass:      'reform-autocompletecombobox-selected'
            overlayClass:       'reform-autocompletecombobox-overlay'
        }
        super @select, @options

        return if !@fake

        $selected = $ '<span></span>'
        $selected.addClass 'reform-autocompletecombobox-selected'
        $selected.addClass 'placeholder'
        $selected.text @options.placeholder

        if @options.title?
            $selected.text @options.title
            $selected.removeClass 'placeholder'

        @fake.append $selected

        @refresh()

        $selected.on 'click', () => 
            @open()
            @fillOptions()

    open: ->
        super
        @currentSelection = ''

        @filter = $ '<input/>' 
        @filter.attr 'type', 'text'
        @filter.addClass @options.inputClass
        @filter.appendTo @floater
        @filter.val ''

        @filter.on "keyup.autocomplete", (e) => @handleKeyDown e

        @filter.focus()
        # $title = $('<span></span>')
        # # if @options.selected then $title.text @options.title  else $selected.text 'Select an item...'
        # $title.text 'Select an item...'

        # $title.appendTo @floater

    setContent: (value, title) ->
        super
        $selected = @fake.find('.' + @options.selectedClass)
        $selected.text title
        $selected.removeClass 'placeholder' if title.length > 0


    # close: ->
    #     console.log 'should close the floater ...'

module.exports = AutocompleteCombobox