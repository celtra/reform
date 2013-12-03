window.$             ?= require "jquery-commonjs"
AutocompleteAbstract  = require "./autocompleteAbstract"

# Implements custom autocomplete box
class AutocompleteBox extends AutocompleteAbstract

    # Generating a fake select box from a real one
    constructor: (@select, options) ->

        @options = $.extend @options, {
            minChars           : 2 
            autocompleteClass  : 'reform-autocompletebox'
        }
        
        super @select, @options

        return if !@el

        @filter = @createFilter()

        if @selectedItem.value isnt 0
            @filter.val @selectedItem.title
            @filter.removeClass @options.placeholderClass

        @el.append @filter

    handleSelectionChanged: ->
        @filter.val @selectedItem.title

        super

    handleFilterChanged: ->
        super

        @orig.val 0
        @orig.data 'title', @filterValue

    handleDisabledToggle: =>
        super
        return if !@filter

        if @orig.is( ':disabled' ) and !@filter.is( ':disabled' )
            @filter.attr 'disabled', 'disabled'
        else 
            @filter.removeAttr 'disabled'

    createClosed: ->
        $el = super

        $el.on 'click', () => 
            if !@floater and @filter.val().length > @options.minChars
                @open()
                @filter.focus()

        $el

    createFilter: ->
        $filter = super

        $filter.on 'blur', () =>
            @close()

        $filter

    open: ->
        @filterValue = @filter.val()
        super

        @handleArrowsToggle()

    close: ->
        super

        @handleArrowsToggle()

    handleArrowsToggle: ->
        return if !@options.showArrows

        if @floater? 
            @el.removeClass @options.arrowDownClass
            @el.addClass @options.arrowUpClass
        else
            @el.removeClass @options.arrowUpClass
            @el.addClass @options.arrowDownClass

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

module.exports = AutocompleteBox