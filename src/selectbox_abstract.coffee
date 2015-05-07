window.$ ?= require "jquery-commonjs"

# Implements custom select boxes
class SelectBoxAbstract
    
    # Generating a fake select box from a real one
    constructor: (@select, options) ->
        @orig = $ @select

        @options = $.extend {
            fakeClass : 'reform-selectbox-fake'
        }, options

        $.extend @options, @orig.data()

        # Don't do this twice
        return if @orig.is '.reformed'
        
        @body = $ 'body'
        
        # Fake select box
        @fake = $('<div/>').addClass 'closed'
        @fake.attr 'tabindex', 0
        
        origClass = @orig.attr 'class'
        @customClass = origClass.replace @options.reformClass, ''
        @customClass = @customClass.trim()
        # todo: move adding a reform class to base
        @fake.addClass 'reform'
             .addClass @customClass
             .addClass @options.fakeClass
             .addClass @options.uiClass

        @fake.addClass 'disabled' if @orig.is ':disabled'

        @orig.hide().attr 'class', 'reformed'

        $selectedItem = $('<div></div>').addClass 'selected-item'
        $selectedItem.appendTo @fake
        
        @refresh()
        @orig.after(@fake).appendTo @fake
        
        @fake.on 'keyup', (ev) =>
            if ev.keyCode is 27
                ev.preventDefault()
                ev.stopPropagation()
        
        @fake.on 'keydown', (ev) =>
            ev.preventDefault()
            ev.stopPropagation()
            return if @orig.is '[multiple]'
            
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
                itemIsDisabled = $item.is '.disabled'
                
                return if itemDoesNotExist or itemIsDisabled
                
                $item.siblings().andSelf().removeClass 'selected'
                $item.addClass 'selected'
                @orig.val(@value()).trigger 'change'
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
        @fake.on 'click', (e) =>
            return if @orig.is ':disabled'
            e.stopPropagation()
            if @floater is null then @open() else @close()
        
        # Prevent text selection
        @fake.on 'mousedown', (e) -> e.preventDefault()
        
        # Replicate changes from the original select box to the fake one
        @orig.on 'reform.sync change DOMSubtreeModified', @refresh
        
        @body.on 'reform.close', => @close()

        # Close any other open options containers
        @body.on 'reform.open', (e) => @close() unless e.target is @select
    
    hover: ($item) ->
        $item.siblings().andSelf().removeClass 'hover'
        $item.addClass 'hover'
    
    scrollTo: ($item) ->
        $container   = @$list
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
        @height = $(document).height()
        @width = $(document).width()
        # List container
        @$list = $('<div/>').attr('class', 'reform-floater-list').addClass(@options.uiClass).appendTo @floater

        # Create top item for multiple selection box
        @textMultiple = ''
        $itemMultiple = $('<div/>').addClass 'reform-floater-item selected'
        
        # List for values of selected items in multiple selection box
        @listMultiple = []
        @selectBoxTitle = @orig.data('title')

        # Filling options
        @orig.find('option').each (i, option) =>
            $option = $ option
            $item = $('<div/>').addClass 'reform-floater-item'
            $item.addClass 'selected' if $option.is ':selected'
            $item.addClass 'disabled' if $option.is ':disabled'
            $item.attr 'title', $option.attr 'title'
            $item.attr 'value', $option.val()

            if @options.showcheckbox and @orig.is '[multiple]'
                checkboxOptions =
                    type  : 'checkbox'
                    class : 'reform-checkbox'

                checkboxOptions.checked  = 'checked'  if $option.is ':selected'
                checkboxOptions.disabled = 'disabled' if $option.is ':disabled'

                $item.append($('<input>', checkboxOptions))

            $item.append @createItemContent $option

            # Disable selected item, add values in @listMultiple
            if $option.is ':selected'
                if  @orig.is '[multiple]'
                    @listMultiple.push $option.html() 
                else
                    $item.addClass 'selected'

                    # Add selected value on top of the list
                    if @selectBoxTitle
                        $itemSelected = $item.clone()
                        $itemSelected.addClass @attributeType
                        $itemSelected.prependTo @$list

            $item.appendTo @$list
            
            # Prevent text selection
            $item.on 'mousedown', (e) -> e.preventDefault()
            
            $item.hover => @hover $item unless @ignoreMouse
            
            # Option selection
            $item.on 'click', (e) =>
                return if $item.is '.disabled'
                
                if @orig.is '[multiple]'
                    $item.toggleClass 'selected'
                    e.stopPropagation()
                else
                    $item.siblings().andSelf().removeClass 'selected'
                    $item.addClass 'selected'
                
                # Update values
                @orig.val(@value()).trigger 'change'

        # Push item with multiple values on top of the list
        if @selectBoxTitle and @listMultiple.length > 0
            $itemMultiple.html @listMultiple.join(", ")
            $itemMultiple.prependTo @$list

        @$list.one 'mousewheel DOMMouseScroll', (e) ->
            e0    = e.originalEvent
            delta = e0.wheelDelta || -e0.detail

            @scrollTop += (if delta < 0 then 1 else -1) * 20
            e.preventDefault()

    value: ->
        @$list.find('.reform-floater-item.selected').map -> $(@).val()
    
    # Generates and opens the options container
    open: =>
        # Let everyone know we're open
        @orig.trigger 'reform.open'

        # Options container
        @floater = $ '<div/>'
        @floater.css 'min-width', @fake.outerWidth()
        # todo: do it better
        @floater.addClass 'reform-floater reform reform-floater-ui'
                .addClass @customClass
                .addClass @orig.data 'floater-class'
                .addClass @options.uiClass
                .addClass 'reform-' + @options.theme

        @body.append @floater
        
        @createOptions()
        
        # Click closes the options layer
        @body.one 'click', @close
        
        # Show the options layer
        @floater.show()

        # Position the options layer
        @positionFloater()
        
        @fake.addClass('opened').removeClass 'closed'

    # Closes the options container
    close: =>
        @floater?.remove()
        @floater = null
        @fake.removeClass 'opened'
        @fake.addClass 'closed'
        unless @orig.is ':disabled'
            @fake.removeClass 'disabled'
    
    # Set the title of the fake select box
    refresh: =>
        @fake.toggleClass 'disabled', @orig.is ':disabled'

        $selectedItem = @fake.find '.selected-item'
        $selectedItem.empty()
        
        if @orig.data 'title'
            $selectedItem.append @orig.data('title')
        else
            $title = @createClosedItem()
            $selectedItem.append $title
        
        @createOptions()

    positionFloater: =>
        if @floater?
            
            # Get position of fake
            pos = @fake.offset()

            # if over is set floater will open over the input not bellow
            if not @options.openOverInput
                if pos.top + @floater.outerHeight() > @height
                    pos.top = pos.top - @floater.outerHeight()
                    if @orig.data 'shift'
                        posTopAfterAnimation = pos.top - parseInt @orig.data('shift') 
                        pos.top -= 1
                else
                    pos.top = pos.top + @fake.outerHeight()
                    if @orig.data 'shift'
                        posTopAfterAnimation = pos.top + parseInt @orig.data('shift') 
                        pos.top += 1

            if pos.left + @floater.outerWidth() > @width
                pos.left = pos.left - @floater.outerWidth() + @fake.outerWidth()

            @floater.css pos
            @floater.animate {top: posTopAfterAnimation}, 200 if @orig.data 'shift'

module.exports = SelectBoxAbstract
