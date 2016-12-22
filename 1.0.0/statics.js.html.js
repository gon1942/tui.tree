tui.util.defineNamespace("fedoc.content", {});
fedoc.content["statics.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview A default values for tree\n */\n\nvar STATE = {\n    NORMAL: 0,\n    EDITABLE: 1\n};\n\nvar DEFAULT = {\n    OPEN: ['open', '-'],\n    CLOSE: ['close', '+'],\n    SELECT_CLASS: 'selected',\n    SUBTREE_CLASS: 'Subtree',\n    VALUE_CLASS: 'valueClass',\n    EDITABLE_CLASS: 'editableClass',\n    TEMPLATE: {\n        EDGE_NODE: '&lt;li class=\"edge_node {{State}}\">' +\n                    '&lt;button type=\"button\">{{StateLabel}}&lt;/button>' +\n                    '&lt;span id=\"{{NodeID}}\" class=\"depth{{Depth}} {{ValueClass}}\">{{Title}}&lt;/span>&lt;em>{{DepthLabel}}&lt;/em>' +\n                    '&lt;ul class=\"{{Subtree}}\" style=\"display:{{Display}}\">{{Children}}&lt;/ul>' +\n                '&lt;/li>',\n        LEAP_NODE: '&lt;li class=\"leap_node\">' +\n                    '&lt;span id=\"{{NodeID}}\" class=\"depth{{Depth}} {{ValueClass}}\">{{Title}}&lt;/span>&lt;em>{{DepthLabel}}&lt;/em>' +\n                '&lt;/li>'\n    },\n    USE_DRAG: false,\n    USE_HELPER: false,\n    HELPER_POS : {\n        x: 10,\n        y: 10\n    }\n};\n\nmodule.exports = {\n    STATE: STATE,\n    DEFAULT: DEFAULT\n};\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"