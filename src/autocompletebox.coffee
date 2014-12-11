window.$             ?= require "jquery-commonjs"
AutocompleteAbstract  = require "./autocomplete_abstract"

# Implements custom autocomplete box
class AutocompleteBox extends AutocompleteAbstract

    # Generating a fake select box from a real one
    constructor: (@select, options) ->

        @options = $.extend {
            showArrows  : no
            reformClass : 'reform-autocompletebox'
            uiClass     : 'reform-autocompletebox-ui'
        }, options

        super @select, @options

        return if !@el

        @filter = @createFilter()

        if @selectedItem.value?
            @filter.val @selectedItem.title

        @el.append @filter

        # If data-min-chars is set to 0, open results immediately
        @el.on 'click', => @open() if @options.minChars is 0

    handleSelectionChanged: ->
        if not @selectedItem.value
            @filter.val @filterValue
            @el.addClass 'new-item'
        else
            @filter.val @selectedItem.title
            @el.removeClass 'new-item'

        super

    handleDisabledToggle: =>
        super
        return if not @filter

        if @orig.is(':disabled') and not @filter.is(':disabled')
            @filter.attr 'disabled', 'disabled'
        else 
            @filter.removeAttr 'disabled'

    createList: (data) ->
        $list = super data

        # add item for new record
        if @filterValue and $.inArray(@filterValue, @data.map (data) -> data.title) is -1
            $item = @createItem { title: "#{@filterValue} (add new)"}
            $item.appendTo $list

        $list

    createClosed: ->
        $el = super

        $el.on 'click', () =>
            if !@floater and @filter.val().length > @options.minChars
                @open()
                @filter.focus()

        $el

    handleFilterBlur: ->
        @setSelectedItemByCurrentFilterValue()

        @close()
        super

    open: ->
        @filterValue = @filter.val()
        super

        @handleArrowsToggle()

    close: ->
        super

        @handleArrowsToggle()

    handleReturnKeyPress: ->
        $item = super

        if !$item || $item.length is 0
            @setSelectedItemByCurrentFilterValue()
            @close()

    handleArrowsToggle: ->
        return if !@options.showArrows

        if @floater? 
            @el.removeClass @options.arrowDownClass
            @el.addClass @options.arrowUpClass
        else
            @el.removeClass @options.arrowUpClass
            @el.addClass @options.arrowDownClass

    handleKeyUp: (e) ->
        return if e.keyCode is @KEY.RETURN

        if @filter.val().length >= @options.minChars
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

    setSelectedItemByCurrentFilterValue: ->
        if @selectedItem.title isnt @filter.val()

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

module.exports = AutocompleteBox