
window.$ ?= require "jquery-commonjs"

# Implements custom select boxes
class AutocompleteBox

    # some defaults
    options: {
        # add your data or supply url
        data: [],
        # request
        url: 'http://localhost:1111/demo/locations.json',
        dataType: 'json',
        max: 1000,

        selected: 0,
        minType: 2,
        delayType: 300,

        matchCase: true,

        # wrap term in floater list in <strong>
        colorTitle: true,
        # will not filter dropdown data if true
        matchAll: false
    }

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

        @cache = new Cache(options)

        @default = $.extend(@default, options)

        @orig = $ @select
        # Don't do this twice
        return if @orig.is ".reformed"

        @body = $ "body"
        
        # Fake autocomplete box
        @fake = $ "<div/>"
        @fake.attr "class", @orig.attr "class"
        @orig.hide().attr "class", "reformed"
        @fake.removeClass("reform-autocompletebox").addClass "reform-autocompletebox-fake"
        @fake.addClass "disabled" if @orig.is ":disabled"

        @input = $ "<input/>"
        @input.addClass "reform-autocompletebox-input"
        @fake.append @input

        @refresh()
        @orig.after(@fake).appendTo @fake

        # This is where options container will be
        @floater = null
        
        # artificial delay so we don't overrun the server
        delay = ( ->
            timer = 0
            (callback, ms) ->
                clearTimeout timer
                timer = setTimeout(callback, ms)
        )()

        @input.on "keyup.autocomplete", (e) =>
            return if @orig.is ":disabled"
            e.stopPropagation()
            
            # key up goes to begining of input
            if e.keyCode == @KEY.UP
                e.preventDefault()

            # no delay key actions
            switch e.keyCode
                when @KEY.DOWN
                    if @floater is null
                        @onChange () =>
                            @open()
                            @refresh()
                    else
                        @setHover(@options.selected + 1)
                    return
                when @KEY.UP
                    @setHover(@options.selected - 1)
                    return
                when @KEY.ESC
                    @close()
                    return                    

            delay () =>
                # get current value
                @currentSelection = @input.val()

                switch e.keyCode
                    when @KEY.RETURN
                        @onChange () =>
                            @selectCurrent()
                    else
                        @options.selected = 0
                        @onChange () =>
                            if @floater is null 
                                @open()
                                @refresh()
                            else
                                @refresh()
            , @options.delayType
                
        @input.on "blur", (e) =>
            @close()

        # Close any other open options containers
        @body.on "reform.open", (e) => @close() unless e.target is @select
    
    # Fill options
    fillOptions: =>
        return unless @floater?

        # Empty the options container
        @floater.empty()

        # List container
        $list = $("<div/>").appendTo @floater
        $list.attr "class", "reform-autocompletebox-list"

        isAny = false;
        num = 0
        # Filling options
        $.each @options.data, (i, item) =>
            if @options.max <= num
                return false

            if @options.matchAll || item.title.indexOf(@currentSelection) != -1
                isAny = true
                $item = $ "<div/>"
                $item.attr "class", "reform-autocompletebox-item"
                $item.attr "title", item.title
                $item.attr "value", item.value
                $item.html item.title
                $item.appendTo $list
                
                # Prevent text selection
                $item.on "mousedown", (e) ->  e.preventDefault()
                
                # Option selection
                $item.on "click", (e) =>
                    return if $item.is '.disabled'
                    @selectCurrent()

                $item.on "mouseenter", (e) =>
                    return if $item.is '.disabled'
                    elem = e.target
                    @setHover($(elem).index() + 1)

                num++

        if !isAny
            @close()

    setHover: (newSelected) =>
        return if !@floater?

        $list = @floater.find('.reform-autocompletebox-list')

        if newSelected < 1
            return
        if newSelected > $list.children().length
            return

        @options.selected = newSelected
        $list.children().removeClass "reform-autocompletebox-hover"
        $list.find(':nth-child('+@options.selected+')').addClass "reform-autocompletebox-hover"

    selectCurrent: =>
        return if !@floater? or @options.selected == 0

        $selected = @floater.find('.reform-autocompletebox-list').find(':nth-child('+@options.selected+')')

        $selected.addClass('selected')

        value = $selected.attr "value"
        title = $selected.attr "title"

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
        @floater.attr "class", "reform-autocompletebox-options"

        @floater.css "min-width", @fake.outerWidth() - 10 - 2
        @floater.addClass @orig.data "options-class"
        @body.append @floater

        # Click closes the options layer
        @body.on "click.autocomplete", (e) =>
            if not $(e.target).hasClass('reform-autocompletebox-input')
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

        @fillOptions()

        if @floater? and @options.colorTitle
            @colorTitles()

    colorTitles: =>

        colorTitle = (title) =>
            coloredTitle = ""
            if @options.matchCase
                pos = title.indexOf(@currentSelection)
            else 
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

        @floater.find(".reform-autocompletebox-item").each (num, item) ->
            $item = $(item);
            title = $item.html()
            title = colorTitle(title)
            $item.html title


    # query the server
    request: (term, success, failure) =>
        
        if not @options.matchCase
            term = term.toLowerCase()

        data = @cache.load(term);

        if data
            if data.length
                success data, term
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
                    limit: @options.max
                }, extraParams),
                success: (data) => # 200 OK
                    parsed = @options.parse?(data, term) || @parse(data, term)

                    # fill data
                    @options.data = parsed

                    @cache.add term, parsed
                    success parsed, term
                error: (data) -> # 500
                    failure data, term
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
        if @options.minType >= @input.val().length
            @close()
            return

        successCallback = (data) =>
            @refresh()
            callback()

        failureCallback = (data) =>

        if @options.url?
            @request @currentSelection, successCallback, failureCallback
        else
            @refresh()
            callback()

class Cache

    data: {}
    length: 0

    options: {
        cacheLength: 100
        matchCase: true
        matchContains: false       
    }


    constructor: (options) ->
        @options = $.extend @options, options

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

    load: (q) ->
        return null if not @options.cacheLength or not @length
        #
        #            * if dealing w/local data and matchContains than we must make sure
        #            * to loop through all the data collections looking for matches
        #            
        if not @options.url and @options.matchContains
          
          # track all matches
          csub = []
          
          # loop through all the data grids for matches
          for k of @data
            
            # don't search through the stMatchSets[""] (minChars: 0) cache
            # this prevents duplicates
            if k.length > 0
              c = data[k]
              $.each c, (i, x) ->
                
                # if we've got a match, add it to the array
                csub.push x  if matchSubset(x.value, q)

          return csub
        
        # if the exact item exists, use it
        else if @data[q]
          return @data[q]
        else if @options.matchSubset
          i = q.length - 1

          while i >= @options.minChars
            c = @data[q.substr(0, i)]
            if c
              csub = []
              $.each c, (i, x) ->
                csub[csub.length] = x  if matchSubset(x.value, q)

              return csub
            i--
        null

module.exports = AutocompleteBox