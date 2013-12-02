window.$     ?= require "jquery-commonjs"
Autocomplete  = require "./autocomplete"

# Implements custom autocomplete box
class AutocompleteBox extends Autocomplete

    # Generating a fake select box from a real one
    constructor: (@select, options) ->

        @options = $.extend @options, {
            autocompleteClass: 'reform-autocompletebox'
            # itemClass:          'reform-autocomplete-item'
            # hoverClass:         'reform-autocomplete-hover'
            # listClass:          'reform-autocomplete-list'
            # optionsClass:       'reform-autocomplete-floater'
            # fakeClass:          'reform-autocomplete-fake'
            # inputClass:         'reform-autocomplete-filter' 
            # overlayClass:       'reform-autocomplete-overlay'
        }
        
        super @select, @options

        # return if !@fake
        return if !@el

        @filter = @createFilter()

        # @filter = $ "<input/>"
        # @filter.addClass @options.inputClass + " placeholder"

        # if @options.placeholder?
        #     @filter.val(@options.placeholder)
        
        if @options.title?
            @filter.val @options.title 
            # @currentSelection = @options.title
            @filter.removeClass @options.placeholderClass

        @el.append @filter

        # @filter.on "click", (e) =>
        #     if @filter.val() == @options.placeholder
        #         @filter.val('')
        #         @filter.removeClass('placeholder')

        # @filter.on "keydown.autocomplete", (e) => @handleKeyDown e

        # @filter.on "blur", (e) =>
        #     @close()

        # # copy state from original
        # @refresh()

    handleSelectionChanged: ->
        @filter.val @selectedItem.title

        super

    createFilter: ->
        $filter = super

        $filter.on 'blur', () =>
            @close()

        $filter.on 'click', () =>
            @open() if @filterValue.length > @options.minChars and !@floater                

        $filter
    
    handleKeyUp: (e) ->
        e.stopPropagation()

        if @filter.val().length > @options.minChars
            @open() unless @floater?
        else
            @close() unless !@floater
            return

        super

    getFloaterPosition: ->
        position = super
        position.top += @el.outerHeight()
        position

    handleDisabledToggle: =>
        super
        return if !@filter

        if @orig.is( ':disabled' ) and !@filter.is( ':disabled' )
            @filter.attr 'disabled', 'disabled'
        else 
            @filter.removeAttr 'disabled'
        # @filter.removeAttr('disabled')
        # @filter.attr("disabled", "disabled") if @orig.is ":disabled"


module.exports = AutocompleteBox