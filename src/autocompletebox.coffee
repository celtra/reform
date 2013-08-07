
window.$ ?= require "jquery-commonjs"

# Implements custom select boxes
class AutocompleteBox

    options: {
        data: [
            {
                title: "one",
                value: "1"
            },
            {
                title: "two",
                value: "2"
            }, 
            {
                title: "three",
                value: "3"
            },                
            {
                title: "four",
                value: "4"
            },
            {
                title: "fourty",
                value: "40"
            }
        ],
        selected: 0,
        minType: 2,

        formatter: null,
        callback: null,

        noRecord: 'No records.'
        matchCase: false,

        # cache
        cacheLength: 100,

        # request
        url: 'http://localhost:1111/demo/locations.json',
        dataType: 'json',
        max: 1000
    }

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
        
        @input.on "keydown.autocomplete", (e) =>
            return if @orig.is ":disabled"
            e.stopPropagation()
            
            # key up goes to begining of input
            if e.keyCode == @KEY.UP
                e.preventDefault()

            setTimeout () =>

                # get current value
                @currentSelection = @input.val()

                switch e.keyCode
                    when @KEY.DOWN
                        @setHover(@options.selected + 1)
                    when @KEY.UP
                        @setHover(@options.selected - 1)
                    when @KEY.RETURN
                        @onChange () =>
                            @selectCurrent()
                    when @KEY.ESC
                        @close()
                    else
                        @options.selected = 0
                        @onChange () =>
                            if @floater is null 
                                @open()
                                @refresh()
                            else
                                @refresh()
            , 0
                
        #@input.on "blur", (e) =>
        #    @close()
        
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
        # Filling options
        $.each @options.data, (i, item) =>
            if item.title.indexOf(@currentSelection) != -1
                isAny = true
                $item = $ "<div/>"
                $item.attr "class", "reform-autocompletebox-item"
                $item.attr "title", item.title
                $item.attr "value", item.value
                $item.text item.title
                $item.appendTo $list
                
                # Prevent text selection
                $item.on "mousedown", (e) -> e.preventDefault()
                
                # Option selection
                $item.on "click", (e) =>
                    return if $item.is '.disabled'
                    @selectCurrent()

                $item.on "mouseenter", (e) =>
                    return if $item.is '.disabled'
                    elem = e.target
                    @setHover($(elem).index() + 1)

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
        @body.one "click", @close
        
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

    request: (term, success, failure) =>
        
        if not @options.matchCase
            term = term.toLowerCase()

        data = @cache.load(term);

        if data
            if data.length
                success term, data
            else
                parsed = options.parse && options.parse(options.noRecord) || parse(options.noRecord)
                success term, parsed
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
                    parsed = @options.parse? && @options.parse(data) || @parse(data)
                    
                    $.each @options.data, (item) =>
                        @cache.add(item.value, item.title)

                    success(term, parsed)
                error: (data) -> # 500
                    #console.log data
                    failure data, term
            });
        else
            failure 'Set options.url', term

    parse: (data) =>
        @options.data = data

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

    data = {}
    length = 0

    options = {}

    constructor: (options) ->
        @options = $.extend @options, options

    matchSubset: (s, sub) ->
        s = s.toLowerCase()  unless @options.matchCase
        i = s.indexOf(sub)
        i = s.toLowerCase().search("\\b" + sub.toLowerCase())  if @options.matchContains is "word"
        return false  if i is -1
        i is 0 or @options.matchContains

    add: (q, value) ->
        flush() if length > @options.cacheLength
        length++  unless data[q]
        data[q] = value

    flush: ->
        data = {}
        length = 0

    load: (q) ->
        return null  if not @options.cacheLength or not length
        
        #
        #            * if dealing w/local data and matchContains than we must make sure
        #            * to loop through all the data collections looking for matches
        #            
        if not @options.url and @options.matchContains
          
          # track all matches
          csub = []
          
          # loop through all the data grids for matches
          for k of data
            
            # don't search through the stMatchSets[""] (minChars: 0) cache
            # this prevents duplicates
            if k.length > 0
              c = data[k]
              $.each c, (i, x) ->
                
                # if we've got a match, add it to the array
                csub.push x  if matchSubset(x.value, q)

          return csub
        
        # if the exact item exists, use it
        else if data[q]
          return data[q]
        else if @options.matchSubset
          i = q.length - 1

          while i >= @options.minChars
            c = data[q.substr(0, i)]
            if c
              csub = []
              $.each c, (i, x) ->
                csub[csub.length] = x  if matchSubset(x.value, q)

              return csub
            i--
        null

module.exports = AutocompleteBox