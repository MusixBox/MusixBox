// Allows debugging to be disabled in each file
tags = {
    'DEFAULT' : true,
    'graphics': false,
    'music': true
}
var currentLogTag = ''

function setLogTag(tag)
{
    if(tag in tags)
    {
        currentLogTag = tag;
    }
    else
    {
        currentLogTag = 'DEFAULT';
    }
}

default_console_log = console.log;
console.log = function() {
    if (!(currentLogTag in tags) || tags[currentLogTag] == true) {
        default_console_log.apply(this, arguments);
    }
}