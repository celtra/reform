CheckBox  = require "./checkbox"
SelectBox = require "./selectbox"

classes =
    "checkbox"  : CheckBox
    "selectbox" : SelectBox

$(document).on "ready", ->
    (new control node for node in $ ".#{cls}") for cls, control of classes

$(document).on "DOMNodeInserted", (e) ->
    node = e.target
    $node = $ node
    (new control node if $node.hasClass cls unless $node.parent().hasClass "#{cls}-fake") for cls, control of classes
