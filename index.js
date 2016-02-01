var parse = require('css-annotation').parse

module.exports = function (options) {
    options = options || {}
    var annotations = parse(options.src)

    return function (root) {
        var matchedRules = []

        root.walkRules(function (node) {
            if (checkExtend(node)) {
                annotations.forEach(function (annotation) {
                    if (node.selector === annotation.rule) {
                        var res = {}
                        res.extend = node.selector
                        if (!Array.isArray(annotation.extend)) {
                            annotation.extend = [annotation.extend]
                        }
                        res.base = annotation.extend
                        matchedRules.push(res)
                    }
                })
            }
        })

        var tmpMatched = []
        var newMatched = []
        matchedRules.forEach(function (matchedRule) {
            matchedRule.base.forEach(function (base) {
                tmpMatched.push({
                    extend: matchedRule.extend,
                    base: base
                })
            })
        })
        tmpMatched.forEach(function (tmp, i) {
            var tmpSelectors = []
            var count = true
            var isOne = true
            for (var j = i + 1; j < tmpMatched.length; j++) {
                if (tmp.base === tmpMatched[j].base) {
                    if (count) tmpSelectors.push(tmp.extend)
                    tmpSelectors.push(tmpMatched[j].extend)
                    count = false
                    isOne = false
                    tmpMatched.splice(j, 1)
                }
            }
            var newSelector  = tmpSelectors.join(',\n')
            if (newSelector) {
                newMatched.push({
                    extend: newSelector,
                    base: tmp.base
                })
            }
            if (isOne) {
                newMatched.push({
                    extend: tmp.extend,
                    base: tmp.base
                })
            }
        })
        matchedRules = newMatched

        root.walkRules(function (node) {
            matchedRules.forEach(function (matchedRule) {
                if (Array.isArray(matchedRule.base)) {
                    matchedRule.base.forEach(function (base) {
                        if (node.selector === base) {
                            node.selector = matchedRule.extend
                            node.change = true;
                        }
                    })
                } else {
                    if (node.selector === matchedRule.base) {
                        node.selector = matchedRule.extend
                        node.change = true;
                    }
                }
            })
        })

        return root

    }
}

function checkBaseRule (node) {
    if (node.nodes) {
        var children = node.nodes
        var text = ''
        children.forEach(function (child) {
            if (child.type === 'comment') text = child.text
        })
        if (text.match(/\@base/)) return true
    }
    return false
}

function checkExtend (node) {
    if (node.nodes) {
        var children = node.nodes
        var text = ''
        children.forEach(function (child) {
            if (child.type === 'comment') text = child.text
        })
        if (text.match(/\@extend/)) return true
    }
    return false
}
