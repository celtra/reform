window.$   ?= require "jquery-commonjs"

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

module.exports = Cache