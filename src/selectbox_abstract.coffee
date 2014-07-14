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

        # Create top item for multiple selection box
        @textMultiple = ""
        $itemMultiple = $ "<div/>"
        $itemMultiple.addClass "reform-floater-item"
        $itemMultiple.addClass "selected-item"
        
        # List for values of selected items in multiple selection box
        @listMultiple = []
        @selectBoxTitle = @orig.data('title')

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

            # Disable selected item, add values in @listMultiple
            if $option.is ":selected"
                if  @orig.is "[multiple]"
                    @listMultiple.push $option.html() 
                else
                    $item.addClass "selected"

                    # Add selected value on top of the list
                    if @selectBoxTitle
                        $itemSelected = $item.clone()
                        $itemSelected.addClass "selected-item"
                        $itemSelected.removeClass "selected"
                        $itemSelected.prependTo @$list
                        $itemSelected.on "mousedown", (e) -> e.preventDefault()

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

        # Push item with multiple values on top of the list
        if @selectBoxTitle
            $itemMultiple.html @listMultiple.join(", ")
            $itemMultiple.prependTo @$list
            $itemMultiple.on "mousedown", (e) -> e.preventDefault()
        
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
            if @orig.data 'shift'
                pos.top = pos.top - @floater.outerHeight() - parseInt @orig.data('shift')
            else
                pos.top = pos.top - @floater.outerHeight()
        else
            if @orig.data 'shift'
                pos.top = pos.top + @fake.outerHeight() + parseInt @orig.data('shift')
            else
                pos.top = pos.top + @fake.outerHeight() 
        if pos.left + @floater.outerWidth() > $window.width()
            pos.left = pos.left - @floater.outerWidth() + @fake.outerWidth()
        
        @floater.css pos

        # Determine the direction and size of slide animation
        if @orig.data 'shift-slide-animation'
            if pos.top + @floater.outerHeight() > $window.height()
                move('.reform-floater').y( - parseInt @orig.data('shift-slide-animation')).end()
            else
                move('.reform-floater').y(parseInt @orig.data('shift-slide-animation')).end()       
        

        @fake.addClass "selected-item"
    
    # Closes the options container
    close: =>
        @floater?.remove()
        @floater = null
        unless @orig.is ":disabled"
            @fake.removeClass "disabled"
    
    # Set the title of the fake select box
    refresh: =>
        @fake.toggleClass "disabled", @orig.is ":disabled"

        $selectedItem = @fake.find '.selected-item'
        $selectedItem.empty()
        
        if @orig.data 'title'
            $selectedItem.append @orig.data('title')
        else
            $title = @createClosedItem()
            $selectedItem.append $title    
        
        @createOptions()

module.exports = SelectBoxAbstract