
window.$ ?= require "jquery-commonjs"

# Implements custom autocomplete box
class AutocompleteBox

    # key mappings
    KEY: {
        UP: 38,
        DOWN: 40,
        DEL: 46,
        RETURN: 13,
        ESC: 27,
        PAGEUP: 33,
        PAGEDOWN: 34,
    }

    cache = null

    # Generating a fake select box from a real one
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

            # custom classes
            autocompleteClass:  'reform-autocompletebox'
            itemClass:          'reform-autocompletebox-item'
            hoverClass:         'reform-autocompletebox-hover'
            listClass:          'reform-autocompletebox-list'
            optionsClass:       'reform-autocompletebox-options'
            fakeClass:          'reform-autocompletebox-fake'
            inputClass:         'reform-autocompletebox-input'
        }

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

        @input = $ "<input/>"
        @input.addClass @options.inputClass + " placeholder"
        @input.val(@options.placeholder)
        @fake.append @input

        @orig.after(@fake).appendTo @fake

        # This is where options container will be
        @floater = null
        
        # artificial delay for server requests we don't overrun the server
        delay = ( ->
            timer = 0
            (callback, ms) ->
                clearTimeout timer
                timer = setTimeout(callback, ms)
        )()

        @input.on "click", (e) =>
            if @input.val() == @options.placeholder
                @input.val('')
                @input.removeClass('placeholder')

        @input.on "keyup.autocomplete", (e) =>
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
                    return
                when @KEY.UP
                    @setHover(@options.selected - 1)
                    return
                when @KEY.ESC
                    @close()
                    return                    

            # only read key when key not pressed for certain amout of time
            delay () =>

                # get current value
                @currentSelection = @input.val()

                switch e.keyCode
                    when @KEY.RETURN
                        @selectCurrent()
                    else
                        @options.selected = 0
                        @onChange () =>

            , @options.delay

        @input.on "blur", (e) =>
            @close()

        # copy state from original
        @refresh()

        # Close any other open options containers
        @body.on "reform.open", (e) => @close() unless e.target is @select
    
        # Replicate changes from the original input to the fake one
        @orig.on "reform.sync change DOMSubtreeModified", => setTimeout @refresh, 0

        # Clean up orphaned options containers
        $('.' + @options.optionsClass).remove()

    # Fill options
    fillOptions: =>
        return unless @floater?

        # Empty the options container
        @floater.empty()

        # List container
        $list = $("<div/>").appendTo @floater
        $list.attr "class", @options.listClass

        isAny = false;
        num = 0
        # Filling options
        $.each @options.data, (i, item) =>
            if @options.max <= num
                return false

            # can match all, usefull for custom requests
            if not @options.matchAll    
                
                title = item.title
                currentSelection = @currentSelection
                if not @options.matchCase
                    title = title.toLowerCase()
                    currentSelection = currentSelection.toLowerCase()
                if title.indexOf(currentSelection) == -1
                    return

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
                elem = e.target
                @setHover($(elem).index() + 1)

            num++

        # close if no items
        if !isAny
            @close()
        else if @floater? and @options.colorTitle
            @colorTitles()

    setHover: (newSelected) =>
        return if !@floater?

        $list = @floater.find('.' + @options.listClass)

        if newSelected < 1
            return
        if newSelected > $list.children().length
            return

        @options.selected = newSelected
        $list.children().removeClass @options.hoverClass
        $list.find(':nth-child('+@options.selected+')').addClass @options.hoverClass

    selectCurrent: =>
        return if !@floater? or @options.selected == 0

        $selected = @floater.find('.' + @options.listClass).find(':nth-child('+@options.selected+')')

        $selected.addClass('selected')

        value = $selected.attr "value"
        title = $selected.attr "title"

        @orig.data("title", title)
        @orig.val(value)
        @input.val(title)

        @orig.trigger("change")

        @close()

    # Generates and opens the options container
    open: =>
        # Let everyone know we're open
        @orig.trigger "reform.open"

        # Options container
        @floater = $ "<div/>"
        @floater.attr "class", @options.optionsClass

        @floater.css "min-width", @fake.outerWidth() - 2
        @floater.addClass @orig.data "options-class"
        @body.append @floater

        # Click closes the options layer
        @body.on "click.autocomplete", (e) =>
            if not $(e.target).hasClass(@options.inputClass)
                @body.off "click.autocomplete"
                @close()
        
        # get position of fake
        pos = @fake.offset()

        # Show the options layer
        @floater.show()
        
        # Position the options layer
        $window = $ window

        pos.top += @fake.outerHeight()

        @floater.css pos

    # Closes the options container
    close: =>
        @floater?.remove()
        @floater = null
    
    refresh: =>
        @fake.toggleClass "disabled", @orig.is ":disabled"
        @input.removeAttr('disabled')
        @input.attr("disabled", "disabled") if @orig.is ":disabled"

    colorTitles: =>

        colorTitle = (title) =>
            coloredTitle = ""
            pos = title.toLowerCase().indexOf(@currentSelection.toLowerCase())

            if pos != -1
                coloredTitle += title.substr(0, pos)
                coloredTitle += "<strong>"
                coloredTitle += title.substr(pos, @currentSelection.length)
                coloredTitle += "</strong>"
                coloredTitle += title.substr(pos + @currentSelection.length, title.length)
            else
                coloredTitle = title

            return coloredTitle

        @floater.find("." + @options.itemClass).each (num, item) ->
            $item = $(item);
            title = $item.html()
            title = colorTitle(title)
            $item.html title

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

            $.ajax({
                dataType: @options.dataType,
                url: @options.url,
                data: $.extend({
                    q: term,
                    matchCase: @options.matchCase
                    limit: @options.max
                }, extraParams),
                success: (data) => # 200 OK
                    parsed = @options.parse?(data, term) || @parse(data, term)

                    # fill data
                    @options.data = parsed

                    # cache results
                    @cache.add term, parsed

                    success()

                error: (data) -> # 500
                    failure()
            });
        else
            failure 'Set options.url', term

    parse: (data, term) =>
        parsed = []

        $.each data, (num, item) =>
            parsed.push({
                    value: item.value
                    title: @options.formatResult and @options.formatResult(item) or item.title
                })

        parsed

    onChange: (callback) =>
        if @options.minChars >= @currentSelection.length
            @close()
            return

        successCallback = () =>
            if @floater is null 
                @open()
                @fillOptions()
            else
                @fillOptions()
            callback()

        failureCallback = () =>
            console.warn("Data not recieved.") if console?

        if @options.url?
            @request @currentSelection, successCallback, failureCallback
        else
            successCallback()

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

module.exports = AutocompleteBox