window.$             ?= require "jquery-commonjs"
AutocompleteAbstract  = require "./autocompleteAbstract"

# Implements custom autocomplete box
class AutocompleteBox extends AutocompleteAbstract

    # Generating a fake select box from a real one
    constructor: (@select, options) ->

        @options = $.extend {
            showArrows         : no
            reformClass        : 'reform-autocompletebox'
            uiClass            : 'reform-autocompletebox-ui'
        }, @options

        super @select, @options

        return if !@el

        @filter = @createFilter()

        if @selectedItem.value?
            @filter.val @selectedItem.title
            @filter.removeClass @options.placeholderClass

        @el.append @filter

    handleSelectionChanged: ->
        @filter.val @selectedItem.title

        super

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

    handleFilterBlur: ->
        if @selectedItem.title isnt @filter.val()

            if @filter.val() is @options.placeholderText
                title = ''
            else
                title = @filter.val()
            
            @getData (data) =>
                matchingItem = null

                if title.length isnt 0
                    for item in data
                        if @options.caseSensitive
                            itemTitle = item.title
                            searchTitle = title
                        else 
                            itemTitle = item.title.toLowerCase()
                            searchTitle = title.toLowerCase()

                        if !matchingItem and itemTitle is searchTitle
                            matchingItem = item

                if matchingItem?
                    @setSelectedItem { value: matchingItem.value, title: matchingItem.title }
                else
                    @setSelectedItem { value: null, title: title }

        @close()
        super

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
        if @filter.val().length > @options.minChars
            @open() unless @floater?
        else if @floater?
            @close() 
            return
        else
            @cancelChanges() if e.keyCode is @KEY.ESC
            return

        super

    getFloaterPosition: ->
        position = super
        position.top += @el.outerHeight()
        position

module.exports = AutocompleteBox