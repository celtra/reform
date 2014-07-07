window.$ ?= require "jquery-commonjs"

# Implements custom select boxes
class SelectBoxAbstract
    
    # Generating a fake select box from a real one
    constructor: (@select, options) ->
        @orig = $ @select

        @options = $.extend {
            fakeClass : 'reform-selectbox-fake'
        }, options
        
        # Don't do this twice
        return if @orig.is ".reformed"
        
        @body = $ "body"
        
        # Fake select box
        @fake = $ "<div/>"
        @fake.attr "tabindex", 0
        
        origClass = @orig.attr 'class'
        @customClass = origClass.replace @options.reformClass, ''
        @customClass = @customClass.trim()
        @fake.addClass 'reform'                         # todo: move to base
        @fake.addClass @customClass
        @fake.addClass @options.fakeClass
        @fake.addClass "disabled" if @orig.is ":disabled"
        @fake.addClass @options.uiClass

        @orig.hide().attr "class", "reformed"

        $selectedItem = $ '<div></div>'
        $selectedItem.addClass 'selected-item'
        $selectedItem.appendTo @fake
        
        @refresh()
        @orig.after(@fake).appendTo @fake
        
        @fake.on "keyup", (ev) =>
            if ev.keyCode is 27
                ev.preventDefault()
                ev.stopPropagation()
        
        @fake.on "keydown", (ev) =>
            ev.preventDefault()
            ev.stopPropagation()
            return if @orig.is "[multiple]"
            
            @fake.focus()
            
            goUp   = ev.keyCode is 38
            goDown = ev.keyCode is 40

            if goUp or goDown
                if not @floater?
                    @open()
                else
                    $current  = if $('.hover', @floater).length is 0 then $('.selected', @floater) else $('.hover', @floater)
                    
                    if goUp
                        $nextItem = if $current.prev().length is 0 then $current.parent().children().last() else $current.prev()
                    else
                        $nextItem = if $current.next().length is 0 then $current.parent().children().first() else $current.next()
                    
                    @hover $nextItem
                    @scrollTo $nextItem
            
            else if ev.keyCode is 13
            
                $item = $(@floater).find '.hover'
                
                itemDoesNotExist = $item.length is 0
                itemIsDisabled = $item.is ".disabled"
                
                return if itemDoesNotExist or itemIsDisabled
                
                $item.siblings().andSelf().removeClass "selected"
                $item.addClass "selected"
                @orig.val(@value()).trigger "change"
                @close()
                         
            else if ev.keyCode is 27
                @close() if @floater?
            else
                done = no
                @$list.children().each (i, item) =>
                    unless done
                        if $(item).text().charAt(0).toLowerCase() is String.fromCharCode(ev.keyCode).toLowerCase()
                            done = yes
                            @hover $(item)
                            @scrollTo $(item)

        # This is where options container will be
        @floater = null
        
        # Click opens the options container
        @fake.on "click", (e) =>
            return if @orig.is ":disabled"
            e.stopPropagation()
            if @floater is null then @open() else @close()
        
        # Prevent text selection
        @fake.on "mousedown", (e) -> e.preventDefault()
        
        # Replicate changes from the original select box to the fake one
        @orig.on "reform.sync change DOMSubtreeModified", @refresh
        
        # Close any other open options containers
        @body.on "reform.open", (e) => @close() unless e.target is @select
    
    hover: ($item) ->
        $item.siblings().andSelf().removeClass "hover"
        $item.addClass "hover"
    
    scrollTo: ($item) ->
        $container   = $item.parent()
        newScrollTop = $item.offset().top - $container.offset().top + $container.scrollTop()
        
        @ignoreMouse = yes
        
        if newScrollTop > ($container.outerHeight() - $item.outerHeight())
            scrollTop = newScrollTop - $container.outerHeight() + $item.outerHeight()
            $container.scrollTop scrollTop
        else
            $container.scrollTop 0
        
        clearTimeout @to if @to
        @to = setTimeout( =>
            @ignoreMouse = no
        , 500)
    
    # Fill options
    createOptions: =>
        return unless @floater?
        
        @fake.focus()
        
        # Empty the options container
        @floater.empty()

        # List container
        @$list = $("<div/>").appendTo @floater
        @$list.attr "class", "reform-floater-list"
        @$list.addClass @options.uiClass

        # Create item for multiple
        @textMultiple = ""
        $itemMultiple = $ "<div/>"
        $itemMultiple.attr "class", "reform-floater-item"
        $itemMultiple.addClass "disabled"
        
        # Filling options
        @orig.find("option").each (i, option) =>
            $option = $ option
            $item = $ "<div/>"
            $item.attr "class", "reform-floater-item"
            $item.addClass "selected" if $option.is ":selected"
            $item.addClass "disabled" if $option.is ":disabled"
            $item.attr "title", $option.attr("title")
            $item.attr "value", $option.val()
            $item.append @createItemContent $option

            # disable selected item, push on top of list
            if $option.is ":selected"
                if  @orig.is "[multiple]"
                    if  @textMultiple == ""
                        @textMultiple += $option.html()
                    else
                        @textMultiple += ", " + $option.html()
                    $itemMultiple.html @textMultiple
                else
                    $itemSelected = $item.clone()
                    $itemSelected.addClass "disabled"
                    $itemSelected.prependTo @$list
                    $item.addClass "disabled"     
            $item.appendTo @$list 

            
            # Prevent text selection
            $item.on "mousedown", (e) -> e.preventDefault()
            
            $item.hover => @hover $item unless @ignoreMouse
            
            
            # Option selection
            $item.on "click", (e) =>
                return if $item.is '.disabled'
                
                if @orig.is "[multiple]"
                    $item.toggleClass "selected"
                    e.stopPropagation()
                else
                    $item.siblings().andSelf().removeClass "selected"
                    $item.addClass "selected"
                
                # Update values
                @orig.val(@value()).trigger "change"

        #push multiple item on top of list
        $itemMultiple.prependTo @$list
    
    value: ->
        @$list.find(".reform-floater-item.selected").map -> $(@).val()
    
    # Generates and opens the options container
    open: =>
        # Let everyone know we're open
        @orig.trigger "reform.open"

        # Options container
        @floater = $ "<div/>"
        @floater.attr "class", "reform-floater"
        @floater.css "min-width", @fake.outerWidth()
        @floater.addClass 'reform'              # todo: do it better
        @floater.addClass @customClass
        @floater.addClass @orig.data "floater-class"
        @floater.addClass @options.uiClass
        @floater.addClass 'reform-floater-ui'   # todo: do it better
        @floater.addClass 'reform-' + @options.theme
        @body.append @floater
        
        @createOptions()
        
        # Click closes the options layer
        @body.one "click", @close
        
        # get position of fake
        pos = @fake.offset()
        
        # Show the options layer
        @floater.show()
        
        # Position the options layer
        $window = $ window
        if pos.top + @floater.outerHeight() > $window.height()
            pos.top = pos.top - @floater.outerHeight() - 5
        else
            pos.top = pos.top + @fake.outerHeight() + 5
        if pos.left + @floater.outerWidth() > $window.width()
            pos.left = pos.left - @floater.outerWidth() + @fake.outerWidth()
        @floater.css pos
    
    # Closes the options container
    close: =>
        @floater?.remove()
        @floater = null
    
    # Set the title of the fake select box
    refresh: =>
        @fake.toggleClass "disabled", @orig.is ":disabled"

        $selectedItem = @fake.find( '.selected-item' )
        $selectedItem.empty()
        
        if @orig.data('title')
            $selectedItem.append @orig.data('title')
        else
            $title = @createClosedItem()
            $selectedItem.append $title    
        
        @createOptions()

module.exports = SelectBoxAbstract