window.$             ?= require "jquery-commonjs"
AutocompleteCombobox  = require "./autocompletecombobox"

class MultilineAutocompleteCombobox extends AutocompleteCombobox
    constructor: (@select, options) ->
        @options = $.extend {
            reformClass       : 'reform-multilineautocompletecombobox'
            descClass         : 'multiline-description'
            filterDescription : yes
        }, options

        super @select, @options

    createItem: (item) ->
        $item = super item

        desc = if item.description then item.description else ""
        $descItem = $ "<span>#{desc}</span>"
        $descItem.addClass @options.descClass
        $descItem.addClass @options.disabledClass if item.disabled

        position = item.description.toLowerCase().indexOf @filterValue.toLowerCase()
        if @options.highlightTitles and @filterValue.length and position isnt -1
            text           = item.description.substring position, position + @filterValue.length # extract text with original casing
            leadingString  = item.description.substring 0, position
            trailingString = item.description.substring position + @filterValue.length, item.description.length

            highlightedText = "<strong>#{@hyphenate( text )}</strong>"
            $descItem.html @hyphenate(leadingString) + highlightedText + @hyphenate(trailingString)

        $descItem.appendTo $item

        $item

    filterData: ->
        if @options.filterDescription
            filteredData = []

            # filter local collection
            for item in @data
                # can match all, usefull for custom requests
                if not @options.exactMatch and @filterValue?
                    title       = item.title
                    description = item.description
                    filterValue = @filterValue

                    if not @options.caseSensitive
                        title       = title.toLowerCase()
                        description = description.toLowerCase()
                        filterValue = filterValue.toLowerCase()

                    if title.indexOf(filterValue) isnt -1 or description.indexOf(filterValue) isnt -1
                        filteredData.push item

                else
                    filteredData.push item

            filteredData
        else
            super

module.exports = MultilineAutocompleteCombobox