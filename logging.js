// Allows debugging to be disabled in each file
tags = {
    'graphics': false,
    'music': true
}

var debugGraphics = createDebugger('graphics');
var debugMusic = createDebugger('music');

function createDebugger(tag)
{
    var debug = function (str) {};
    if(!tag in tags || tags[tag] == true)
    {
        debug = console.log.bind(window.console);
    }

    return debug;
}