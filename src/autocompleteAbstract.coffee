window.$   ?= require "jquery-commonjs"
Cache       = require "./cache"

class AutocompleteAbstract

    KEY : {
        UP       : 38
        DOWN     : 40
        DEL      : 46
        RETURN   : 13
        ESC      : 27
        PAGEUP   : 33
        PAGEDOWN : 34
    }

    constructor: (@select, options) ->
        # some defaults
        @options = {
            data                : []        # supply data
            url                 : null      # or url
            dataType            : 'json'
            max                 : 1000      # max results
            minChars            : 0
            delay               : 300
            caseSensitive       : yes
            highlightTitles     : yes
            showArrows          : yes
            exactMatch          : no        # will not filter dropdown data if true
            title               : null      # preset selected title
            placeholderText     : 'Type to search...'
            emptyText           : 'No results.'

            # custom classes
            autocompleteClass   : 'reform-autocomplete'
            fakeClass           : 'reform-autocomplete-fake'
            floaterClass        : 'reform-autocomplete-floater'
            overlayClass        : 'reform-autocomplete-overlay'
            filterClass         : 'reform-autocomplete-filter'
            listClass           : 'reform-autocomplete-list'
            itemClass           : 'reform-autocomplete-item'
            hoverClass          : 'reform-autocomplete-hover'
            arrowDownClass      : 'reform-autocomplete-arrowDown'
            arrowUpClass        : 'reform-autocomplete-arrowUp'
            emptyClass          : 'reform-autocomplete-empty'
            placeholderClass    : 'placeholder'
            disabledClass       : 'disabled'
        }
        
        @orig    = $ @select

        # Don't do this twice
        return if @orig.is ".reformed"

        # read inline params
        inlineOptions = @orig.data()

        $.extend(@options, options)
        $.extend(@options, inlineOptions)

        # backward compatibility
        @options.customParams     = @options.extraParams unless !@options.extraParams
        @options.caseSensitive    = @options.matchCase   unless !@options.matchCase 
        @options.highlightTitles  = @options.colorTitle  unless !@options.colorTitle
        @options.exactMatch       = @options.matchAll    unless !@options.matchAll
        @options.placeholderText  = @options.placeholder unless !@options.placeholder
        @options.showArrows       = @options.arrow       unless !@options.arrow
        
        # set initial state
        if @options.title? then @filterValue = @options.title else @filterValue = ''
        if @orig.val().length is 0 
            @selectedItem = { value: 0, title: '' }
        else
            @selectedItem = { value: @orig.val(), title: @options.title }

        # clear delay if data is local
        @cache = new Cache(@options) if @options.url?

        @el      = null
        @floater = null
        @list    = null
        @filter  = null

        @el = @createClosed()

        @orig.hide().attr "class", "reformed"

        @orig.after(@el).appendTo @el

        # Close any other open options containers
        $( 'body' ).on "reform.open", (e) => @close() unless e.target is @select

        # Replicate changes from the original input to the fake one
        @orig.on "reform.sync change DOMSubtreeModified", => setTimeout @refreshState, 0

        # Close this selectbox
        @orig.on "reform.close", (e) => @close()

        # set inline data
        @orig.on "reform.fill", (e, data) => @handleDataFill(data)

        # reform events
        @el.on 'filterChanged', => @handleFilterChanged()

        @el.on 'selectedItemChanged', => @handleSelectionChanged()

        @refreshState()

    handleSelectionChanged: ->
        @orig.val @selectedItem.value
        @orig.data 'title', @selectedItem.title
        @orig.trigger 'change'

    handleDataFill: (data) ->
        return if @options.url

        @close()
        @options.data = @parse(data)

    handleFilterChanged: ->
        return if !@floater

        @getData (data) =>
            $list = @createList data

            @insertList $list

    handleDisabledToggle: ->
        if @orig.is( ':disabled' ) and !@el.hasClass( ':disabled' )
            @close()
            @el.addClass @options.disabledClass
        else if !@orig.is( ':disabled' ) and !@el.hasClass( ':disabled' )
            @el.removeClass @options.disabledClass

    setFilterValue: (value) ->
        oldValue = @filterValue
        @filterValue = value

        @el.trigger 'filterChanged', { oldValue: oldValue, newValue: @filterValue }

    setSelectedItem: (item) ->
        @selectedItem = item

        @el.trigger 'selectedItemChanged', item

    refreshState: =>
        @handleDisabledToggle()

    createClosed: ->
        $el = $ "<div/>"
        $el.attr "class", @orig.attr "class"
        $el.removeClass @options.autocompleteClass
        $el.addClass @options.fakeClass
        $el.addClass @options.disabledClass if @orig.is ":disabled"

        if @options.showArrows?
            $el.addClass @options.arrowDownClass

        $el

    createFloater: ->
        $floater = $ "<div/>"
        $floater.addClass @options.floaterClass
        $floater.css "min-width", @el.outerWidth() - 2

    createFilter: ->
        $filter = $ "<input/>"
        $filter.addClass @options.filterClass
        $filter.addClass @options.placeholderClass

        if @options.placeholderText?
            $filter.val @options.placeholderText

        $filter.on 'focus', (e) =>
            if $filter.val() == @options.placeholderText
                $filter.val ''
                $filter.removeClass @options.placeholderClass

        $filter.on 'blur', () =>
            if $filter.val().length is 0
                $filter.val @options.placeholderText
                $filter.addClass @options.placeholderClass

        $filter.on "keyup.autocomplete", (e) => @handleKeyUp e

        $filter

    createEmptyList: ->
        $list = $ '<div></div>'
        $list.addClass @options.listClass

        $list

    createList: (data) ->
        $list = @createEmptyList()

        return if !data

        count = 0
        for item in data
            return if @options.max <= count

            $item = @createItem item
            $item.appendTo $list

            count++

        $list

    createItem: (item) ->
        $item = $ '<div></div>'
        $item.addClass @options.itemClass
        $item.attr 'title', item.title # obsolete - use data-title
        $item.attr 'value', item.value # obsolete - use data-value
        $item.data 'value', item.value
        
        if item.value is @selectedItem.value
            $item.addClass @options.hoverClass

        if @options.highlightTitles
            highlightedText = "<strong>#{@filterValue}</strong>"
            $item.html item.title.replace @filterValue, highlightedText
        else 
            $item.text item.title
        
        # Prevent text selection
        $item.on 'mousedown', (e) ->  e.preventDefault()

        # Item selection
        $item.on 'click', (e) => @handleItemSelect $ (e.target)

        # hover items
        $item.on 'mouseenter', (e) => @setHover $ (e.target)

        $item

    insertList: ($list) ->
        return if !@floater

        @list.empty()
        @list.append $list.children()

        if @list.children().length is 0
            @handleEmptyList()

        @list

    handleEmptyList: ->
        @close()

    open: ->
        return if @floater? or @el.hasClass @options.disabledClass
        
        # Let everyone know we're open
        @orig.trigger "reform.open"

        @floater = @createFloater()

        $overlay = $ '<div></div>'
        $overlay.addClass @options.overlayClass

        $overlay.one 'click', () => @close()

        @list = @createEmptyList()
        @list.appendTo @floater

        @floater.css @getFloaterPosition()

        $body = $ 'body'
        $body.append $overlay
        $body.append @floater

        @getData (data) =>
            $list = @createList data
            @insertList $list

    close: ->
        return if !@floater

        @floater.siblings('.' + @options.overlayClass).remove()
        @floater.remove()
        @floater = null
        @list = null

        @filterValue = ''
        clearTimeout @fetchTimeout

    cancelChanges: ->
        @filterValue = @selectedItem.title
        
        @filter.val @filterValue

        @el.trigger 'selectedItemChanged', @selectedItem

    handleKeyUp: (e) ->
        return if @orig.is ':disabled'

        # key up goes to begining of input
        if e.keyCode is @KEY.UP or e.keyCode is @KEY.RETURN
            e.preventDefault()
        
        switch e.keyCode
            when @KEY.DOWN
                @moveHover 'down'
            when @KEY.UP
                @moveHover 'up'
            when @KEY.RETURN
                @handleItemSelect @list.find '.' + @options.hoverClass
            when @KEY.ESC
                @cancelChanges()
                @close()
            else
                @setFilterValue @filter.val()

    handleItemSelect: ($item) ->
        return if $item.length is 0
        @setSelectedItem { value: $item.data( 'value' ), title: $item.text() }
        @close()

    moveHover: (direction = 'down') ->
        return if !@floater

        $current = @list.find '.' + @options.hoverClass

        if $current.length is 0
            $nextHover = @list.find '.' + @options.itemClass + ':first-child'
        else if direction is 'down'
            $nextHover = $current.next()
        else if direction is 'up'
            $nextHover = $current.prev()

        if $nextHover.length isnt 0
            @setHover $nextHover
            @scrollTo $nextHover

    scrollTo: ($item) ->
        return if !@floater

        $container   = $item.parent()
        newScrollTop = $item.offset().top - $container.offset().top + $container.scrollTop()
        
        if newScrollTop > ($container.outerHeight() - $item.outerHeight())
            scrollTop = newScrollTop - $container.outerHeight() + $item.outerHeight()
            $container.scrollTop scrollTop
        else
            $container.scrollTop 0

    setHover: ($item) ->
        return if !@floater
                
        $items = @list.find '.' + @options.itemClass
        $items.removeClass @options.hoverClass
        
        $item.addClass @options.hoverClass

    getFloaterPosition: ->
        @el.offset()

    parse: (data) ->
        parsed = []

        $.each data, (num, item) =>
            parsed.push({
                value: item.value
                title: @options.formatResult and @options.formatResult(item) or item.title
            })

        parsed

    getData: (callback) ->
        return if !callback

        if @options.url
            @loadDataFromUrl callback
        else 
            data = @filterData()
            callback data

    filterData: ->
        filteredData = []

        # filter local collection
        for item in @options.data
            # can match all, usefull for custom requests
            if not @options.exactMatch and @filterValue?    
                title = item.title
                filterValue = @filterValue
                
                if not @options.caseSensitive
                    title = title.toLowerCase()
                    filterValue = filterValue.toLowerCase()
                
                if title.indexOf(filterValue) isnt -1
                    filteredData.push item

            else 
                filteredData.push item

        filteredData

    loadDataFromUrl: (callback) ->
        data = @cache.load @filterValue
        if data?
            callback data
            return

        params = {
            q           : @filterValue
            matchCase   : @options.caseSensitive
            limit       : @options.max
            timeStamp   : new Date()
        }

        if @options.customParams?
            customParams = []

            for key, param in @options.customParams
                customParams[key] = if typeof param is "function" then param() else param

            $.extend params, customParams        

        fetchDataCallback = () =>
            @fetchData params, (data) =>
                parsedData = @options.parse?(data) || @parse data
                @cache.add @filterValue, parsedData
                if callback? then callback parsedData

        clearTimeout @fetchTimeout
        @fetchTimeout = setTimeout fetchDataCallback, @options.delay

    fetchData: (params, successCallback) ->
        # abort any ajax request allready in progress
        @lastXHR.abort() if @ajaxInProgress

        @ajaxInProgress = yes
        @orig.trigger 'ajaxRequestStarted'

        @lastXHR = $.ajax {
            dataType    : @options.dataType
            url         : @options.url
            data        : params
            success: (data) => # 200 OK
                @ajaxInProgress = no
                @orig.trigger 'ajaxRequestFinished'

                successCallback data
            error: (data) => # 500
                @ajaxInProgress = no
                @orig.trigger 'ajaxRequestFinished'

                console.log data
        }

module.exports = AutocompleteAbstract