window.$   ?= require "jquery-commonjs"
Cache       = require "./cache"
_           = require "underscore"

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
            url                : null      # data url
            dataType           : 'json'
            max                : 1000      # max results
            minChars           : 0
            delay              : 0
            caseSensitive      : no
            highlightTitles    : yes
            highlightSelection : yes
            hyphenate          : yes       # will break long strings if true
            exactMatch         : no        # will not filter dropdown data if true
            title              : null      # preset selected title
            placeholderText    : 'Type to search...'

            # custom classes
            fakeClass          : 'reform-autocomplete-fake'
            filterClass        : 'reform-autocomplete-filter'
            emptyClass         : 'reform-autocomplete-empty'
            disabledClass      : 'disabled'
            arrowDownClass     : 'arrow-down'
            arrowUpClass       : 'arrow-up'
            hoverClass         : 'hover'
            selectedClass      : 'selected'
            floaterClass       : 'reform-floater'
            listClass          : 'reform-floater-list'
            itemClass          : 'reform-floater-item'
            overlayClass       : 'reform-floater-overlay'
        }
        
        @orig = $ @select

        # Don't do this twice
        return if @orig.is '.reformed'

        # read inline params
        inlineOptions = @orig.data()

        $.extend(@options, options)
        $.extend(@options, inlineOptions)

        # backward compatibility
        @options.customParams    = @options.extraParams unless !@options.extraParams
        @options.caseSensitive   = @options.matchCase   unless !@options.matchCase
        @options.highlightTitles = @options.colorTitle  unless !@options.colorTitle
        @options.exactMatch      = @options.matchAll    unless !@options.matchAll
        @options.placeholderText = @options.placeholder unless !@options.placeholder
        @options.showArrows      = @options.arrow       unless !@options.arrow

        # set initial state
        @data = []
        if @options.title? then @filterValue = @options.title else @filterValue = ''
        if @orig.val().length is 0 
            @selectedItem = { value: null, title: '' }
        else
            @selectedItem = { value: @orig.val(), title: @options.title }

        # clear delay if data is local
        @cache = new Cache(@options) if @options.url?

        @el          = null
        @floater     = null
        @list        = null
        @filter      = null
        @customClass = null

        # extract custom classes from orig
        @initCustomClass()

        @el = @createClosed()

        @orig.hide().attr 'class', 'reformed'

        @orig.after(@el).appendTo @el

        # Close any other open options containers
        $('body').on 'reform.open', (e) => @close() unless e.target is @select

        # Replicate changes from the original input to the fake one
        @orig.on 'reform.sync change DOMSubtreeModified', => setTimeout @refreshState, 0

        # Close this selectbox
        @orig.on 'reform.close', (e) => @close()

        # set inline data
        @orig.on 'reform.fill', (e, data) => @handleDataFill data

        # reform events
        @el.on 'filterChanged', => @handleFilterChanged()

        @el.on 'selectedItemChanged', => @handleSelectionChanged()

        @refreshState()

    initCustomClass: ->
        origClass = @orig.attr 'class'
        @customClass = origClass.replace @options.reformClass, ''
        @customClass = @customClass.trim()

    handleSelectionChanged: ->
        @orig.val @selectedItem.value
        @orig.data 'title', @selectedItem.title
        @orig.trigger 'change', @selectedItem

    handleDataFill: (data) ->
        return if @options.url

        @close()
        @data = @parse data 

    handleFilterChanged: ->
        return if !@floater

        @getData (data) =>
            $list = @createList data

            @insertList $list

    handleDisabledToggle: ->
        if @orig.is(':disabled') and !@el.hasClass(':disabled')
            @close()
            @el.addClass @options.disabledClass
        else if !@orig.is(':disabled') and !@el.hasClass(':disabled')
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
        $el = $ '<div/>'
        $el.addClass 'reform'
        $el.addClass @customClass
        $el.addClass @options.uiClass
        $el.addClass @options.fakeClass
        $el.addClass @options.disabledClass if @orig.is ':disabled'

        if @options.showArrows
            $el.addClass @options.arrowDownClass

        $el

    createFloater: ->
        $floater = $ '<div/>'
        $floater.addClass 'reform'
        $floater.addClass @customClass
        $floater.addClass @options.uiClass
        $floater.addClass @options.floaterClass
        $floater.css 'min-width', @el.outerWidth()

    createFilter: ->
        $filter = $ '<input/>'
        $filter.addClass @options.filterClass

        if @orig.is ':disabled'
            $filter.attr 'disabled', 'disabled'

        if @options.placeholderText?
            $filter.attr 'placeholder', @options.placeholderText

        $filter.on 'blur',                 ()  => @handleFilterBlur()
        $filter.on 'keyup.autocomplete',   (e) => @handleKeyUp e
        $filter.on 'keydown.autocomplete', (e) => @handleKeyDown e

        $filter

    handleFilterBlur: ->

    createEmptyList: ->
        $list = $ '<div></div>'
        $list.addClass @options.listClass
        $list

    createList: (data) ->
        $list = @createEmptyList()

        return if !data

        # Create groups
        groups = []
        for item in data
            if item.isGroup
                $group = @createGroup item
                groups.push encodeURIComponent item.group
                $group.appendTo $list

        # Create items
        count = 0
        listItems = []
        for item in data
            if @options.max > count
                unless item.isGroup
                    $item = @createItem item
                    listItems.push item
                    if item.group
                        # Item is nested under a group, if a group exists
                        $item.appendTo $list.find("[data-group-id='"+encodeURIComponent(item.group)+"']")
                    else
                        $item.appendTo $list

            count++

        # Open groups that contain a matching string
        groupsToOpen = [] # set of groups with matches
        for item in listItems
            position = item.title.toLowerCase().indexOf @filterValue.toLowerCase()
            if @filterValue.length isnt 0 and position isnt -1
                group = encodeURIComponent item.group
                unless group in groupsToOpen
                    groupsToOpen.push group
                    @handleGroupSelect $list.find('[data-group-id="'+group+'"]')

        # Remove groups that does not contain a matching string
        if @filterValue.length isnt 0
            groupsToHide = _.difference groups, groupsToOpen
            for group in groupsToHide
                $list.find('[data-group-id="'+group+'"]').remove()

        $list

    createGroup: (group) ->
        $group = $ "<div><span>"+group.title+"</span></div>"
        $group.attr 'data-group-id', encodeURIComponent(group.group)
        $group.addClass 'reform-group'

        $group.on 'mousedown',  (e) -> e.preventDefault() # Prevent text selection
        $group.on 'click',      (e) => @handleGroupSelect $(e.target).closest('div')
        $group.on 'mouseenter', (e) => @setHover $ (e.target)

        $group

    createItem: (item) ->
        $item = $ '<div></div>'
        $item.addClass @options.itemClass
        $item.data 'title', item.title
        $item.data 'value', item.value
        $item.attr 'title', item.tooltip                        if item.tooltip
        $item.attr 'data-group', encodeURIComponent(item.group) if item.group
        $item.addClass @options.disabledClass                   if item.disabled

        position = item.title.toLowerCase().indexOf @filterValue.toLowerCase()
        if @options.highlightTitles and @filterValue.length isnt 0 and position isnt -1
            text           = item.title.substring position, position + @filterValue.length # extract text with original casing
            leadingString  = item.title.substring 0, position
            trailingString = item.title.substring position + @filterValue.length, item.title.length
            
            highlightedText = "<strong>#{@hyphenate( text )}</strong>"
            $item.html @hyphenate(leadingString) + highlightedText + @hyphenate(trailingString)
        else
            $item.html @hyphenate(item.title)

        if @options.highlightSelection and @selectedItem.value?
            $item.addClass @options.selectedClass if item.value is @selectedItem.value
        
        $item.on 'mousedown',  (e) -> e.preventDefault() # Prevent text selection
        $item.on 'click',      (e) => @handleItemSelect $(e.target)
        $item.on 'mouseenter', (e) => @setHover $ (e.target)

        $item

    handleGroupSelect: ($group) ->
        $group.toggleClass 'opened'

    handleItemSelect: ($item) ->
        return if $item.length is 0
        return if $item.hasClass @options.disabledClass

        if $item.is 'strong'
            $item = $item.closest 'div'

        if @options.highlightSelection
            @list.children().removeClass @options.selectedClass
            $item.addClass @options.selectedClass
        
        @setSelectedItem { value: $item.data('value'), title: $item.data('title') }
        @close()

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
        
        @orig.trigger 'reform.open'

        @floater = @createFloater()

        $overlay = $ '<div></div>'
        $overlay.addClass 'reform'
        $overlay.addClass @options.overlayClass
        $overlay.addClass @customClass

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

        @orig.trigger 'reform.closed'

    cancelChanges: ->
        @filterValue = @selectedItem.title
        
        @filter.val @filterValue

        @el.trigger 'selectedItemChanged', @selectedItem

    handleKeyDown: (e) ->
        return if @orig.is ':disabled'

        if e.keyCode is @KEY.UP
            e.preventDefault()

        switch e.keyCode
            when @KEY.DOWN
                @moveHover 'down'
            when @KEY.UP
                @moveHover 'up'
            when @KEY.ESC
                e.preventDefault() if @floater?
            when @KEY.RETURN
                e.preventDefault() if @floater?
                @handleReturnKeyPress()
            else
                return

    handleKeyUp: (e) ->
        return if @orig.is ':disabled'

        switch e.keyCode
            when @KEY.DOWN, @KEY.UP, @KEY.RETURN
                return
            when @KEY.ESC
                @cancelChanges()
                @close()
            else
                @setFilterValue @filter.val()
                @orig.val @filter.val()
                @orig.trigger 'keyup', e

    handleReturnKeyPress: ->
        if @floater?
            $item = @list.find '.' + @options.hoverClass
            @handleItemSelect $item

        $item

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

    hyphenate: (value) ->
        return value unless @options.hyphenate

        seperator       = '&shy;'
        chars           = value.split ''
        hyphenatedValue = ''

        for char in chars
            if hyphenatedValue.length is 0 or char in [' ', '-']
                hyphenatedValue += char
            else 
                hyphenatedValue += seperator + char

        hyphenatedValue

    parse: (data) ->
        parsed = []

        addItem = (item) =>
            parsed.push {
                value    : item.value
                title    : @options.formatResult and @options.formatResult(item) or item.title
                group    : if item.group?    then item.group    else null
                tooltip  : if item.tooltip?  then item.tooltip  else null
                disabled : if item.disabled? then item.disabled else null
            }

        if data[0].group
            for group in @getDataGroups data
                parsed.push { title: group, group: group, isGroup: true }

                for item in data
                    addItem item  if item['group'] is group
        else
            for item in data
                addItem item

        parsed

    getDataGroups: (data) ->
        dataGroups = []
        for item in data
            dataGroups.push item.group unless item.group in dataGroups

        dataGroups.sort()

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
        for item in @data
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
        currentFilter = @filterValue

        data = @cache.load currentFilter
        if data?
            callback data
            return

        params = {
            q         : currentFilter
            matchCase : @options.caseSensitive
            limit     : @options.max
            timeStamp : new Date()
        }

        if @options.customParams?
            customParams = []

            for key, param in @options.customParams
                customParams[key] = if typeof param is 'function' then param() else param

            $.extend params, customParams        

        fetchDataCallback = () =>
            @fetchData params, (data) =>
                parsedData = @parse data
                @cache.add currentFilter, parsedData
                if callback? then callback parsedData

        clearTimeout @fetchTimeout
        @fetchTimeout = setTimeout fetchDataCallback, @options.delay

    fetchData: (params, successCallback) ->
        # abort any ajax request allready in progress
        @lastXHR.abort() if @ajaxInProgress

        @ajaxInProgress = yes
        @orig.trigger 'ajaxRequestStarted'

        @lastXHR = $.ajax {
            dataType : @options.dataType
            url      : @options.url
            data     : params
            success: (data) => # 200 OK
                @ajaxInProgress = no
                @orig.trigger 'ajaxRequestFinished'

                successCallback data
            error: (data) => # 500
                @ajaxInProgress = no
                @orig.trigger 'ajaxRequestFinished'

                console.log 'Error: ', data
        }

module.exports = AutocompleteAbstract