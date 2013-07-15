
window.$ ?= require "jquery-commonjs"

# Implements custom select boxes
class AutocompleteBox

    # Generating a fake select box from a real one
    constructor: (@select, @options) ->
        @orig = $ @select

        @options = {
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
                }
            ],
            selected: 0,
            minType: 2,

            formatter: null,
            callback: null,
            cache: null
        }

        @KEY = {
            UP: 38,
            DOWN: 40,
            DEL: 46,
            RETURN: 13,
            ESC: 27,
            PAGEUP: 33,
            PAGEDOWN: 34,
        };
        
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
        
        @input.on "keydown", (e) =>
            return if @orig.is ":disabled"
            e.stopPropagation()
            
            setTimeout () =>

                if @options.minType >= @input.val().length
                    @close()
                    return                

                @currentSelection = @input.val()

                switch e.keyCode
                    when @KEY.DOWN
                        @setHover(@options.selected + 1)
                    when @KEY.UP
                        @setHover(@options.selected - 1)
                    when @KEY.RETURN
                        @selectCurrent()
                    when @KEY.ESC
                        @close()
                    else
                        @options.selected = 0
                        if @floater is null 
                            @open()
                            @refresh()
                        else
                            @refresh()
            , 0
                
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
        if pos.top + @floater.outerHeight() > $window.height()
            pos.top = pos.top - @floater.outerHeight() + @fake.outerHeight()
        if pos.left + @floater.outerWidth() > $window.width()
            pos.left = pos.left - @floater.outerWidth() + @fake.outerWidth()

        pos.top += @fake.outerHeight()

        @floater.css pos

    # Closes the options container
    close: =>
        @floater?.remove()
        @floater = null
    
    refresh: =>
        @fake.toggleClass "disabled", @orig.is ":disabled"
        @fillOptions()

module.exports = AutocompleteBox