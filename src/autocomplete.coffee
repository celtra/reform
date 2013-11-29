window.$ ?= require "jquery-commonjs"

class Autocomplete

    KEY : {
        UP       : 38,
        DOWN     : 40,
        DEL      : 46,
        RETURN   : 13,
        ESC      : 27,
        PAGEUP   : 33,
        PAGEDOWN : 34
    }

    @cache : null

    constructor: (@select, options) ->

        # some defaults
        @options = {
            # add your data or supply url
            data: []
            url: null

            # request options
            dataType: 'json'
            max: 1000

            selected: 0

            minChars: 2
            delay: 300

            matchCase: false

            # wrap term in floater list in <strong>
            colorTitle: true
            # will not filter dropdown data if true
            matchAll: false

            placeholder: "Input search string..."
            # preset input title
            title: null

            # custom classes
            autocompleteClass:  'reform-autocomplete'
            itemClass:          'reform-autocomplete-item'
            hoverClass:         'reform-autocomplete-hover'
            listClass:          'reform-autocomplete-list'
            optionsClass:       'reform-autocomplete-options'
            fakeClass:          'reform-autocomplete-fake'
            inputClass:         'reform-autocomplete-input'
            overlayClass:       'reform-autocomplete-overlay'
        }

        @currentSelection = ''
        @currentList = []

        @orig = $ @select

        # Don't do this twice
        return if @orig.is ".reformed"

        # read inline params
        inlineOptions = @orig.data()

        $.extend(@options, options)
        $.extend(@options, inlineOptions)

        @cache = new Cache(@options)

        @body = $ "body"
        
        # clear delay if data is local
        @options.delay = 0 if not @options.url?

        # Fake autocomplete box
        @fake = $ "<div/>"
        @fake.attr "class", @orig.attr "class"
        @orig.hide().attr "class", "reformed"
        @fake.removeClass(@options.autocompleteClass).addClass @options.fakeClass
        @fake.addClass "disabled" if @orig.is ":disabled"

        if @options.title?
            @currentSelection = @options.title

        if @options.arrow?
            @fake.addClass 'arrow'

        # @fake.on "click", (e) =>
        #     return if @orig.is ":disabled"
        #     e.stopPropagation()
        #     if @floater is null and @currentSelection.length > @options.minChars and @currentSelection != ''
        #         @open()
        #         @fillOptions()
        #     else
        #         @close()

        @orig.after(@fake).appendTo @fake

        # This is where options container will be
        @floater = null
        @filter = null

        # copy state from original
        # @refresh()

        # Close any other open options containers
        @body.on "reform.open", (e) => @close() unless e.target is @select
    
        # Replicate changes from the original input to the fake one
        @orig.on "reform.sync change DOMSubtreeModified", => setTimeout @refresh, 0

        # Close this selectbox
        @orig.on "reform.close", (e) => @close()

        # set inline data
        @orig.on "reform.fill", (e, data) => @options.data = @parse(data, @currentSelection)

        # Clean up orphaned options containers
        $('.' + @options.optionsClass).remove()

    handleKeyDown: (e) ->
        debugger
        e.stopPropagation()
        return if @orig.is ":disabled"
        
        # key up goes to begining of input
        if e.keyCode == @KEY.UP
            e.preventDefault()

        # no delay key actions
        switch e.keyCode
            when @KEY.DOWN
                if @floater is null
                    @onChange () =>
                        @options.selected = 0
                else
                    @setHover(@options.selected + 1)
                    @scrollTo();
                return
            when @KEY.UP
                @setHover(@options.selected - 1)
                @scrollTo()
                return
            when @KEY.ESC
                @close()
                return                    

        # only read key when key not pressed for certain amout of time
        delay = @delay()
        delay () =>

            # get current value
            @currentSelection = @filter.val()
            # append selection to elem
            @orig.val(null)
            @orig.data 'title', @currentSelection

            switch e.keyCode
                when @KEY.RETURN
                    @selectCurrent()
                else
                    @options.selected = 0
                    @onChange () =>

        , @options.delay

    delay: ->
        timer = 0
        (callback, ms) ->
            clearTimeout timer
            timer = setTimeout(callback, ms)

    # scroll container currently selected item
    scrollTo: () ->
        $item = @floater.find('.' + @options.listClass).find(':nth-child('+@options.selected+')')

        $container   = $item.parent()
        newScrollTop = $item.offset().top - $container.offset().top + $container.scrollTop()
        
        if newScrollTop > ($container.outerHeight() - $item.outerHeight())
            scrollTop = newScrollTop - $container.outerHeight() + $item.outerHeight()
            $container.scrollTop scrollTop
        else
            $container.scrollTop 0

    # Fill options
    fillOptions: =>
        return unless @floater?

        # Empty the options container
        @floater.find('.' + @options.listClass).remove()

        # List container
        @currentList = []
        $list = $("<div/>").appendTo @floater
        $list.attr "class", @options.listClass

        isAny = false;
        num = 0

        # Filling options
        
        $.each @options.data, (i, item) =>
            if @options.max <= num
                return false

            # can match all, usefull for custom requests
            if not @options.matchAll and @currentSelection?    
                title = item.title
                currentSelection = @currentSelection
                
                if not @options.matchCase
                    title = title.toLowerCase()
                    currentSelection = currentSelection.toLowerCase()
                
                if title.indexOf(currentSelection) == -1
                    return

            @currentList.push item

            isAny = true
            $item = $ "<div/>"
            $item.attr "class", @options.itemClass
            $item.attr "title", item.title
            $item.attr "value", item.value
            $item.html item.title
            $item.appendTo $list
            
            # Prevent text selection
            $item.on "mousedown", (e) ->  e.preventDefault()
            
            # Option selection
            $item.on "click", (e) =>
                @selectCurrent()

            $item.on "mouseenter", (e) =>
                @setHover($(e.target).index() + 1)

            num++

        # close if no items
        if !isAny
            @close()
        else if @floater? and @options.colorTitle
            @colorTitles()

    refresh: =>
        @fake.toggleClass "disabled", @orig.is ":disabled"

    parse: (data, term) =>
        parsed = []

        $.each data, (num, item) =>
            parsed.push({
                    value: item.value
                    title: @options.formatResult and @options.formatResult(item) or item.title
                })

        parsed

    setHover: (newSelected) =>
        return if !@floater?

        $list = @floater.find('.' + @options.listClass)

        if newSelected < 1
            newSelected = $list.children().length
        if newSelected > $list.children().length
            newSelected = 1

        @options.selected = newSelected
        $list.children().removeClass @options.hoverClass
        $list.find(':nth-child('+@options.selected+')').addClass @options.hoverClass


    selectCurrent: =>
        return if !@floater? or @options.selected == 0

        $selected = @floater.find('.' + @options.listClass).find(':nth-child('+@options.selected+')')

        $selected.addClass('selected')

        value = $selected.attr "value"
        title = $selected.attr "title"
        
        @setContent value, title

        @close()

    setContent: (value, title) =>
        @orig.val value
        @orig.data 'title', title
        @orig.trigger "change"
        @filter.val title

    colorTitles: =>

        colorTitle = (title) =>
            coloredTitle = title
            
            if @currentSelection?
                pos = title.toLowerCase().indexOf(@currentSelection.toLowerCase())
                
                if pos != -1
                    coloredTitle  = title.substr(0, pos)
                    coloredTitle += "<strong>"
                    coloredTitle += title.substr(pos, @currentSelection.length)
                    coloredTitle += "</strong>"
                    coloredTitle += title.substr(pos + @currentSelection.length, title.length)

            return coloredTitle

        @floater.find("." + @options.itemClass).each (num, item) ->
            $item = $(item);
            title = $item.html()
            title = colorTitle(title)
            $item.html title

    # Generates and opens the options container
    open: ->
        # debugger
        # Let everyone know we're open
        @orig.trigger "reform.open"

        # Options container
        @floater = $ "<div/>"
        @floater.attr "class", @options.optionsClass

        @floater.css "min-width", @fake.outerWidth() - 2
        @floater.addClass @orig.data "options-class"

        $overlay = $ '<div></div>'
        $overlay.addClass @options.overlayClass

        @fake.addClass 'open'

        @body.append @floater

        $overlay.one 'click', () => 
            @close()
            $overlay.remove()
        # Click closes the options layer
        # @body.on "click.autocomplete", (e) =>
        #     debugger
        #     if not $(e.target).hasClass(@options.inputClass)
        #         @body.off "click.autocomplete"
        #         @close()
        
        # get position of fake
        pos = @fake.offset()

        # Show the options layer
        @floater.show()
        
        # Position the options layer
        $window = $ window

        pos.top += @fake.outerHeight()

        @floater.css pos

        $overlay.insertBefore @floater

    close: =>
        @floater?.remove()
        @floater = null
        @fake.removeClass 'open'
        
        if @currentList.length is 1
            isSameCaseSensitive   = @filter.val() is @currentList[0].title
            isSameCaseInsensitive = @filter.val().toLowerCase() is @currentList[0].title.toLowerCase()
            
            if (@options.matchCase and isSameCaseSensitive) or (!@options.matchCase and isSameCaseInsensitive)
                @setContent @currentList[0].value, @currentList[0].title

    onChange: (callback) =>
        debugger
        if @options.minChars >= @currentSelection.length
            @close()
            return

        successCallback = () =>
            if @floater is null 
                @open()
                @fillOptions()
            else
                @fillOptions()

            @orig.trigger('ajaxRequestFinished')

            callback()

        failureCallback = () =>
            @orig.trigger('ajaxRequestFinished')

        if @options.url?
            @orig.trigger('ajaxRequestStarted')

            @request @currentSelection, successCallback, failureCallback
        else
            successCallback()


    # query the server
    request: (term, success, failure) =>
        
        data = @cache.load(term);

        if data
            success()
        else if @options.url?
            extraParams = {
                timestamp: new Date()
            }

            if @options.extraParams?
                $.each @options.extraParams, (key, param) ->
                    extraParams[key] = (if typeof param is "function" then param() else param)

            # abort any ajax request allready in progress
            if @ajaxInProgress
                @lastXHR.abort()
            @ajaxInProgress = true

            @lastXHR = $.ajax({
                dataType: @options.dataType,
                url: @options.url,
                data: $.extend({
                    q: term,
                    matchCase: @options.matchCase
                    limit: @options.max
                }, extraParams),
                success: (data) => # 200 OK
                    @ajaxInProgress = false

                    parsed = @options.parse?(data, term) || @parse(data, term)

                    # fill data
                    @options.data = parsed

                    # cache results
                    @cache.add term, parsed

                    success()

                error: (data) -> # 500
                    @ajaxInProgress = false

                    failure()
            });
        else
            failure 'Set options.url', term

class Cache

    data: {}
    length: 0

    options: {
        cacheLength: 100
        matchContains: false
        matchSubset: true
    }

    constructor: (options) ->
        $.extend(@options, options)

    matchSubset: (s, sub) ->
        s = s.toLowerCase()  unless @options.matchCase
        i = s.indexOf(sub)
        i = s.toLowerCase().search("\\b" + sub.toLowerCase())  if @options.matchContains is "word"
        return false  if i is -1
        i is 0 or @options.matchContains

    add: (q, value) ->
        flush() if @length > @options.cacheLength
        @length++  unless @data[q]
        @data[q] = value

    flush: ->
        @data = {}
        @length = 0

    load: (q) =>
        return null if not @options.cacheLength or not @length
        
        if @data[q]
          return @data[q]
        else if @options.matchSubset
          i = q.length - 1

          while i >= @options.minChars
            c = @data[q.substr(0, i)]
            if c
              csub = []

              self = @
              $.each c, (i, x) ->
                csub[csub.length] = x if self.matchSubset(x.title, q)

              return csub
            i--
        null
module.exports = Autocomplete