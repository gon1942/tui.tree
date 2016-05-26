tui.util.defineNamespace("fedoc.content", {});
fedoc.content["tree.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview Render tree and update tree.\n * @author NHN Ent. FE dev team.&lt;dl_javascript@nhnent.com>\n */\n\n'use strict';\n\nvar util = require('./util'),\n    defaultOption = require('./consts/defaultOption'),\n    states = require('./consts/states'),\n    messages = require('./consts/messages'),\n    outerTemplate = require('./consts/outerTemplate'),\n    TreeModel = require('./treeModel'),\n    Selectable = require('./features/selectable'),\n    Draggable = require('./features/draggable'),\n    Editable = require('./features/editable'),\n    Checkbox = require('./features/checkbox'),\n    ContextMenu = require('./features/contextMenu');\n\nvar nodeStates = states.node,\n    features = {\n        Selectable: Selectable,\n        Draggable: Draggable,\n        Editable: Editable,\n        Checkbox: Checkbox,\n        ContextMenu: ContextMenu\n    },\n    snippet = tui.util,\n    extend = snippet.extend,\n    TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK = 200,\n    MOUSE_MOVING_THRESHOLD = 5;\n/**\n * Create tree model and inject data to model\n * @class Tree\n * @constructor\n * @mixes tui.util.CustomEvents\n * @param {Object} data A data to be used on tree\n * @param {Object} options The options\n *     @param {HTMLElement} [options.rootElement] Root element (It should be 'UL' element)\n *     @param {string} [options.nodeIdPrefix] A default prefix of a node\n *     @param {Object} [options.nodeDefaultState] A default state of a node\n *     @param {Object} [options.template] A markup set to make element\n *         @param {string} [options.template.internalNode] HTML template\n *         @param {string} [options.template.leafNode] HTML template\n *     @param {Object} [options.stateLabels] Toggle button state label\n *         @param {string} [options.stateLabels.opened] State-OPENED label (Text or HTML)\n *         @param {string} [options.stateLabels.closed] State-CLOSED label (Text or HTML)\n *     @param {Object} [options.classNames] Class names for tree\n *         @param {string} [options.classNames.nodeClass] A class name for node\n *         @param {string} [options.classNames.leafClass] A class name for leaf node\n *         @param {string} [options.classNames.openedClass] A class name for opened node\n *         @param {string} [options.classNames.closedClass] A class name for closed node\n *         @param {string} [options.classNames.textClass] A class name that for textElement in node\n *         @param {string} [options.classNames.subtreeClass] A class name for subtree in internal node\n *         @param {string} [options.classNames.toggleBtnClass] A class name for toggle button in internal node\n *     @param {Function} [options.renderTemplate] Function for rendering template\n * @example\n * //Default options:\n * // {\n * //     nodeIdPrefix: 'tui-tree-node-'\n * //     nodeDefaultState: 'closed',\n * //     stateLabels: {\n * //         opened: '-',\n * //         closed: '+'\n * //     },\n * //     classNames: {\n * //         nodeClass: 'tui-tree-node',\n * //         leafClass: 'tui-tree-leaf',\n * //         openedClass: 'tui-tree-opened',\n * //         closedClass: 'tui-tree-closed',\n * //         subtreeClass: 'tui-tree-subtree',\n * //         toggleBtnClass: 'tui-tree-toggleBtn',\n * //         textClass: 'tui-tree-text',\n * //     },\n * //     template: {\n * //         internalNode:\n * //             '&lt;button type=\"button\" class=\"{{toggleBtnClass}}\">{{stateLabel}}&lt;/button>' +\n * //             '&lt;span class=\"{{textClass}}\">{{text}}&lt;/span>' +\n * //             '&lt;ul class=\"{{subtreeClass}}\">{{children}}&lt;/ul>'\n * //         leafNode:\n * //             '&lt;span class=\"{{textClass}}\">{{text}}&lt;/span>' +\n * //     }\n * // }\n * //\n *\n * var data = [\n *     {text: 'rootA', children: [\n *         {text: 'root-1A'},\n *         {text: 'root-1B'},\n *         {text: 'root-1C'},\n *         {text: 'root-1D'},\n *         {text: 'root-2A', children: [\n *             {text:'sub_1A', children:[\n *                 {text:'sub_sub_1A'}\n *             ]},\n *             {text:'sub_2A'}\n *         ]},\n *         {text: 'root-2B'},\n *         {text: 'root-2C'},\n *         {text: 'root-2D'},\n *         {text: 'root-3A', children: [\n *             {text:'sub3_a'},\n *             {text:'sub3_b'}\n *         ]},\n *         {text: 'root-3B'},\n *         {text: 'root-3C'},\n *         {text: 'root-3D'}\n *     ]},\n *     {text: 'rootB', children: [\n *         {text:'B_sub1'},\n *         {text:'B_sub2'},\n *         {text:'b'}\n *     ]}\n * ];\n *\n * var tree1 = new tui.component.Tree(data, {\n *     rootElement: 'treeRoot', // or document.getElementById('treeRoot')\n *     nodeDefaultState: 'opened',\n *\n *     // ========= Option: Override template renderer ===========\n *\n *     template: { // template for Mustache engine\n *         internalNode:\n *             '&lt;button type=\"button\" class=\"{{toggleBtnClass}}\">{{{stateLabel}}}&lt;/button>' +\n *             '&lt;span class=\"{{textClass}}\">{{{text}}}&lt;/span>' +\n *             '&lt;ul class=\"{{subtreeClass}}\">{{{children}}}&lt;/ul>'\n *         leafNode:\n *             '&lt;span class=\"{{textClass}}\">{{{text}}}&lt;/span>' +\n *     },\n *     renderTemplate: function(source, props) {\n *         // Mustache template engine\n *         return Mustache.render(template, props);\n *     }\n * });\n **/\nvar Tree = snippet.defineClass(/** @lends Tree.prototype */{ /*eslint-disable*/\n    init: function(data, options) { /*eslint-enable*/\n        options = extend({}, defaultOption, options);\n\n        /**\n         * Default class names\n         * @type {object.&lt;string, string>}\n         */\n        this.classNames = extend({}, defaultOption.classNames, options.classNames);\n\n        /**\n         * Default template\n         * @type {{internalNode: string, leafNode: string}}\n         */\n        this.template = extend({}, defaultOption.template, options.template);\n\n        /**\n         * Root element\n         * @type {HTMLElement}\n         */\n        this.rootElement = options.rootElement;\n\n        /**\n         * Toggle button state label\n         * @type {{opened: string, closed: string}}\n         */\n        this.stateLabels = options.stateLabels;\n\n        /**\n         * Make tree model\n         * @type {TreeModel}\n         */\n        this.model = new TreeModel(data, options);\n\n        /**\n         * Enabled features\n         * @type {Object.&lt;string, object>}\n         */\n        this.enabledFeatures = {};\n\n        /**\n         * Click timer to prevent click-duplication with double click\n         * @type {number}\n         */\n        this.clickTimer = null;\n\n        /**\n         * To prevent click event if mouse moved before mouseup.\n         * @type {number}\n         */\n        this._mouseMovingFlag = false;\n\n        /**\n         * Render template\n         * It can be overrode by user's template engine.\n         * @type {Function}\n         * @private\n         */\n        this._renderTemplate = options.renderTemplate || util.renderTemplate;\n\n        /**\n         * True when a node is moving\n         * @api\n         * @type {boolean}\n         * @example\n         * tree.on({\n         *     beforeDraw: function(nodeId) {\n         *         if (tree.isMovingNode) {\n         *             return;\n         *         }\n         *         //..\n         *     },\n         *     //....\n         * });\n         * tree.move('tui-tree-node-1', 'tui-tree-node-2');\n         */\n        this.isMovingNode = false;\n\n        this._setRoot();\n        this._draw(this.getRootNodeId());\n        this._setEvents();\n    },\n\n    /**\n     * Set root element of tree\n     * @private\n     */\n    _setRoot: function() {\n        var rootEl = this.rootElement;\n\n        if (snippet.isString(rootEl)) {\n            rootEl = this.rootElement = document.getElementById(rootEl);\n        }\n\n        if (!snippet.isHTMLNode(rootEl)) {\n            throw new Error(messages.INVALID_ROOT_ELEMENT);\n        }\n    },\n\n    /**\n     * Move event handler\n     * @param {string} nodeId - Node id\n     * @param {string} originalParentId - Original parent node id\n     * @param {string} newParentId - New parent node id\n     * @param {number} [index] - Start index number for inserting\n     * @private\n     */\n    _onMove: function(nodeId, originalParentId, newParentId, index) {\n        this._draw(originalParentId);\n        this._draw(newParentId);\n\n        /**\n         * @api\n         * @event Tree#move\n         * @param {{nodeId: string, originalParentId: string, newParentId: string, index: number}} treeEvent - Event\n         * @example\n         * tree.on('move', function(treeEvent) {\n         *     var nodeId = treeEvent.nodeId,\n         *         originalParentId = treeEvent.originalParentId,\n         *         newParentId = treeEvent.newParentId,\n         *         index = treeEvent.index;\n         *\n         *     console.log(nodeId, originalParentId, newParentId, index);\n         * });\n         */\n        this.fire('move', {\n            nodeId: nodeId,\n            originalParentId: originalParentId,\n            newParentId: newParentId,\n            index: index\n        });\n    },\n\n    /**\n     * Set event handlers\n     * @private\n     */\n    _setEvents: function() {\n        this.model.on({\n            update: this._draw,\n            move: this._onMove\n        }, this);\n        util.addEventListener(this.rootElement, 'click', snippet.bind(this._onClick, this));\n        util.addEventListener(this.rootElement, 'mousedown', snippet.bind(this._onMousedown, this));\n        util.addEventListener(this.rootElement, 'dblclick', snippet.bind(this._onDoubleClick, this));\n        util.addEventListener(this.rootElement, 'contextmenu', snippet.bind(this._onContextMenu, this));\n    },\n\n    /**\n     * Event handler - contextmenu\n     * @param {MouseEvent} mouseEvent - Contextmenu event\n     * @private\n     */\n    _onContextMenu: function(mouseEvent) {\n        this.fire('contextmenu', mouseEvent);\n    },\n\n    /**\n     * Event handler - mousedown\n     * @param {MouseEvent} downEvent - Mouse event\n     * @private\n     */\n    _onMousedown: function(downEvent) {\n        var self = this,\n            clientX = downEvent.clientX,\n            clientY = downEvent.clientY,\n            abs = Math.abs;\n\n        function onMouseMove(moveEvent) {\n            var newClientX = moveEvent.clientX,\n                newClientY = moveEvent.clientY;\n\n            if (abs(newClientX - clientX) + abs(newClientY - clientY) > MOUSE_MOVING_THRESHOLD) {\n                self.fire('mousemove', moveEvent);\n                self._mouseMovingFlag = true;\n            }\n        }\n        function onMouseUp(upEvent) {\n            self.fire('mouseup', upEvent);\n            util.removeEventListener(document, 'mousemove', onMouseMove);\n            util.removeEventListener(document, 'mouseup', onMouseUp);\n        }\n\n        this._mouseMovingFlag = false;\n        this.fire('mousedown', downEvent);\n        util.addEventListener(document, 'mousemove', onMouseMove);\n        util.addEventListener(document, 'mouseup', onMouseUp);\n    },\n\n    /**\n     * Event handler - click\n     * @param {MouseEvent} event - Click event\n     * @private\n     */\n    _onClick: function(event) {\n        var target = util.getTarget(event),\n            self = this;\n\n        if (util.isRightButton(event)) {\n            this.clickTimer = null;\n\n            return;\n        }\n\n        if (util.hasClass(target, this.classNames.toggleBtnClass)) {\n            this.toggle(this.getNodeIdFromElement(target));\n\n            return;\n        }\n\n        if (!this.clickTimer &amp;&amp; !this._mouseMovingFlag) {\n            this.fire('singleClick', event);\n            this.clickTimer = setTimeout(function() {\n                self.resetClickTimer();\n            }, TIMEOUT_TO_DIFFERENTIATE_CLICK_AND_DBLCLICK);\n        }\n    },\n\n    /**\n     * Event handler - double click (dblclick)\n     * @param {MouseEvent} event - Double click event\n     * @private\n     */\n    _onDoubleClick: function(event) {\n        this.fire('doubleClick', event);\n        this.resetClickTimer();\n    },\n\n    /**\n     * Set node state - opened or closed\n     * @param {string} nodeId - Node id\n     * @param {string} state - Node state\n     * @private\n     */\n    _setDisplayFromNodeState: function(nodeId, state) {\n        var subtreeElement = this._getSubtreeElement(nodeId),\n            label, btnElement, nodeElement;\n\n        if (!subtreeElement || subtreeElement === this.rootElement) {\n            return;\n        }\n        label = this.stateLabels[state];\n        nodeElement = document.getElementById(nodeId);\n        btnElement = util.getElementsByClassName(\n            nodeElement,\n            this.classNames.toggleBtnClass\n        )[0];\n\n        if (state === nodeStates.OPENED) {\n            subtreeElement.style.display = '';\n        } else {\n            subtreeElement.style.display = 'none';\n        }\n        this._setNodeClassNameFromState(nodeElement, state);\n\n        if (btnElement) {\n            btnElement.innerHTML = label;\n        }\n    },\n\n    /**\n     * Set node class name from provided state\n     * @param {HTMLElement} nodeElement - TreeNode element\n     * @param {string} state - New changed state\n     * @private\n     */\n    _setNodeClassNameFromState: function(nodeElement, state) {\n        var classNames = this.classNames,\n            openedClassName = classNames[nodeStates.OPENED + 'Class'],\n            closedClassName = classNames[nodeStates.CLOSED + 'Class'];\n\n        util.removeClass(nodeElement, openedClassName);\n        util.removeClass(nodeElement, closedClassName);\n        util.addClass(nodeElement, classNames[state + 'Class']);\n    },\n\n\n    /**\n     * Make html\n     * @param {Array.&lt;string>} nodeIds - Node id list\n     * @returns {string} HTML\n     * @private\n     * @see outerTemplate uses \"util.renderTemplate\"\n     */\n    _makeHtml: function(nodeIds) {\n        var model = this.model,\n            html = '';\n\n        snippet.forEach(nodeIds, function(nodeId) {\n            var node = model.getNode(nodeId),\n                sources, props;\n\n            if (!node) {\n                return;\n            }\n\n            sources = this._getTemplate(node);\n            props = this._makeTemplateProps(node);\n            props.innerTemplate = this._makeInnerHTML(node, {\n                source: sources.inner,\n                props: props\n            });\n            html += util.renderTemplate(sources.outer, props);\n        }, this);\n\n        return html;\n    },\n\n    /**\n     * Make inner html of node\n     * @param {TreeNode} node - Node\n     * @param {{source: string, props: Object}} [cached] - Cashed data to make html\n     * @returns {string} Inner html of node\n     * @private\n     * @see innerTemplate uses \"this._renderTemplate\"\n     */\n    _makeInnerHTML: function(node, cached) {\n        var source, props;\n\n        cached = cached || {};\n        source = cached.source || this._getTemplate(node).inner;\n        props = cached.props || this._makeTemplateProps(node);\n\n        return this._renderTemplate(source, props);\n    },\n\n    /**\n     * Get template sources\n     * @param {TreeNode} node - Node\n     * @returns {{inner: string, outer: string}} Template sources\n     * @private\n     */\n    _getTemplate: function(node) {\n        var source;\n\n        if (node.isLeaf()) {\n            source = {\n                inner: this.template.leafNode,\n                outer: outerTemplate.LEAF_NODE\n            };\n        } else {\n            source = {\n                inner: this.template.internalNode,\n                outer: outerTemplate.INTERNAL_NODE\n            };\n        }\n\n        return source;\n    },\n\n    /**\n     * Make template properties\n     * @param {TreeNode} node - Node\n     * @returns {Object} Template properties\n     * @private\n     */\n    _makeTemplateProps: function(node) {\n        var classNames = this.classNames,\n            props, state;\n\n        if (node.isLeaf()) {\n            props = {\n                id: node.getId(),\n                isLeaf: true // for custom template method\n            };\n        } else {\n            state = node.getState();\n            props = {\n                id: node.getId(),\n                stateClass: classNames[state + 'Class'],\n                stateLabel: this.stateLabels[state],\n                children: this._makeHtml(node.getChildIds())\n            };\n        }\n\n        return extend(props, classNames, node.getAllData());\n    },\n\n    /**\n     * Draw element of node\n     * @param {string} nodeId - Node id\n     * @private\n     */\n    _draw: function(nodeId) {\n        var node = this.model.getNode(nodeId),\n            element, html;\n\n        if (!node) {\n            return;\n        }\n\n        /**\n         * @api\n         * @event Tree#beforeDraw\n         * @param {string} nodeId - Node id\n         * @example\n         * tree.on('beforeDraw', function(nodeId) {\n         *     if (tree.isMovingNode) {\n         *         console.log('isMovingNode');\n         *     }\n         *     console.log('beforeDraw: ' + nodeId);\n         * });\n         */\n        this.fire('beforeDraw', nodeId);\n\n        if (node.isRoot()) {\n            html = this._makeHtml(node.getChildIds());\n            element = this.rootElement;\n        } else {\n            html = this._makeInnerHTML(node);\n            element = document.getElementById(nodeId);\n        }\n        element.innerHTML = html;\n        this._setClassWithDisplay(node);\n\n        /**\n         * @api\n         * @event Tree#afterDraw\n         * @param {string} nodeId - Node id\n         * @example\n         * tree.on('afterDraw', function(nodeId) {\n         *     if (tree.isMovingNode) {\n         *         console.log('isMovingNode');\n         *     }\n         *     console.log('afterDraw: ' + nodeId);\n         * });\n         */\n        this.fire('afterDraw', nodeId);\n    },\n\n    /**\n     * Set class and display of node element\n     * @param {TreeNode} node - Node\n     * @private\n     */\n    _setClassWithDisplay: function(node) {\n        var nodeId = node.getId(),\n            element = document.getElementById(nodeId),\n            classNames = this.classNames;\n\n        if (node.isLeaf()) {\n            util.removeClass(element, classNames.openedClass);\n            util.removeClass(element, classNames.closedClass);\n            util.addClass(element, classNames.leafClass);\n        } else {\n            this._setDisplayFromNodeState(nodeId, node.getState());\n            this.each(function(child) {\n                this._setClassWithDisplay(child);\n            }, nodeId, this);\n        }\n    },\n\n    /**\n     * Get subtree element\n     * @param {string} nodeId - TreeNode id\n     * @returns {HTMLElement} Subtree element\n     * @private\n     */\n    _getSubtreeElement: function(nodeId) {\n        var node = this.model.getNode(nodeId),\n            subtreeElement;\n\n        if (!node || node.isLeaf()) {\n            subtreeElement = null;\n        } else if (node.isRoot()) {\n            subtreeElement = this.rootElement;\n        } else {\n            subtreeElement = util.getElementsByClassName(\n                document.getElementById(nodeId),\n                this.classNames.subtreeClass\n            )[0];\n        }\n\n        return subtreeElement;\n    },\n\n    /**\n     * Return the depth of node\n     * @api\n     * @param {string} nodeId - Node id\n     * @returns {number|undefined} Depth\n     */\n    getDepth: function(nodeId) {\n        return this.model.getDepth(nodeId);\n    },\n\n    /**\n     * Return the last depth of tree\n     * @api\n     * @returns {number} Last depth\n     */\n    getLastDepth: function() {\n        return this.model.getLastDepth();\n    },\n\n    /**\n     * Return root node id\n     * @api\n     * @returns {string} Root node id\n     */\n    getRootNodeId: function() {\n        return this.model.rootNode.getId();\n    },\n\n    /**\n     * Return child ids\n     * @api\n     * @param {string} nodeId - Node id\n     * @returns {Array.&lt;string>|undefined} Child ids\n     */\n    getChildIds: function(nodeId) {\n        return this.model.getChildIds(nodeId);\n    },\n\n    /**\n     * Return parent id of node\n     * @api\n     * @param {string} nodeId - Node id\n     * @returns {string|undefined} Parent id\n     */\n    getParentId: function(nodeId) {\n        return this.model.getParentId(nodeId);\n    },\n\n    /**\n     * Reset click timer\n     */\n    resetClickTimer: function() {\n        window.clearTimeout(this.clickTimer);\n        this.clickTimer = null;\n    },\n\n    /**\n     * Get node id from element\n     * @api\n     * @param {HTMLElement} element - Element\n     * @returns {string} Node id\n     * @example\n     * tree.getNodeIdFromElement(elementInNode); // 'tui-tree-node-3'\n     */\n    getNodeIdFromElement: function(element) {\n        var idPrefix = this.getNodeIdPrefix();\n\n        while (element &amp;&amp; element.id.indexOf(idPrefix) === -1) {\n            element = element.parentElement;\n        }\n\n        return element ? element.id : '';\n    },\n\n    /**\n     * Get prefix of node id\n     * @api\n     * @returns {string} Prefix of node id\n     * @example\n     * tree.getNodeIdPrefix(); // 'tui-tree-node-'\n     */\n    getNodeIdPrefix: function() {\n        return this.model.getNodeIdPrefix();\n    },\n\n    /**\n     * Get node data\n     * @api\n     * @param {string} nodeId - Node id\n     * @returns {object|undefined} Node data\n     */\n    getNodeData: function(nodeId) {\n        return this.model.getNodeData(nodeId);\n    },\n\n    /**\n     * Set data properties of a node\n     * @api\n     * @param {string} nodeId - Node id\n     * @param {object} data - Properties\n     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event\n     * @exmaple\n     * tree.setNodeData(nodeId, {foo: 'bar'}); // auto refresh\n     * tree.setNodeData(nodeId, {foo: 'bar'}, true); // not refresh\n     */\n    setNodeData: function(nodeId, data, isSilent) {\n        this.model.setNodeData(nodeId, data, isSilent);\n    },\n\n    /**\n     * Remove node data\n     * @api\n     * @param {string} nodeId - Node id\n     * @param {string|Array} names - Names of properties\n     * @param {boolean} [isSilent] - If true, it doesn't trigger the 'update' event\n     * @example\n     * tree.setNodeData(nodeId, 'foo'); // auto refresh\n     * tree.setNodeData(nodeId, 'foo', true); // not refresh\n     */\n    removeNodeData: function(nodeId, names, isSilent) {\n        this.model.removeNodeData(nodeId, names, isSilent);\n    },\n\n    /**\n     * Get node state.\n     * @api\n     * @param {string} nodeId - Node id\n     * @returns {string|null} Node state(('opened', 'closed', null)\n     * @example\n     * tree.getState(nodeId); // 'opened', 'closed',\n     *                        // undefined if the node is nonexistent\n     */\n    getState: function(nodeId) {\n        var node = this.model.getNode(nodeId);\n\n        if (!node) {\n            return null;\n        }\n\n        return node.getState();\n    },\n\n    /**\n     * Open node\n     * @api\n     * @param {string} nodeId - Node id\n     */\n    open: function(nodeId) {\n        var node = this.model.getNode(nodeId),\n            state = nodeStates.OPENED;\n\n        if (node &amp;&amp; !node.isRoot()) {\n            node.setState(state);\n            this._setDisplayFromNodeState(nodeId, state);\n        }\n    },\n\n    /**\n     * Close node\n     * @api\n     * @param {string} nodeId - Node id\n     */\n    close: function(nodeId) {\n        var node = this.model.getNode(nodeId),\n            state = nodeStates.CLOSED;\n\n        if (node &amp;&amp; !node.isRoot()) {\n            node.setState(state);\n            this._setDisplayFromNodeState(nodeId, state);\n        }\n    },\n\n    /**\n     * Toggle node\n     * @api\n     * @param {string} nodeId - Node id\n     */\n    toggle: function(nodeId) {\n        var node = this.model.getNode(nodeId),\n            state;\n\n        if (node &amp;&amp; !node.isRoot()) {\n            node.toggleState();\n            state = node.getState();\n            this._setDisplayFromNodeState(nodeId, state);\n        }\n    },\n\n    /**\n     * Sort all nodes\n     * @api\n     * @param {Function} comparator - Comparator for sorting\n     * @param {boolean} [isSilent] - If true, it doesn't redraw tree\n     * @example\n     * // Sort with redrawing tree\n     * tree.sort(function(nodeA, nodeB) {\n     *     var aValue = nodeA.getData('text'),\n     *         bValue = nodeB.getData('text');\n     *\n     *     if (!bValue || !bValue.localeCompare) {\n     *         return 0;\n     *     }\n     *     return bValue.localeCompare(aValue);\n     * });\n     *\n     * // Sort, but not redraw tree\n     * tree.sort(function(nodeA, nodeB) {\n     *     var aValue = nodeA.getData('text'),\n     *         bValue = nodeB.getData('text');\n     *\n     *     if (!bValue || !bValue.localeCompare) {\n     *         return 0;\n     *     }\n     *     return bValue.localeCompare(aValue);\n     * }, true);\n     */\n    sort: function(comparator, isSilent) {\n        this.model.sort(comparator);\n        if (!isSilent) {\n            this.refresh();\n        }\n    },\n\n    /**\n     * Refresh tree or node's children\n     * @api\n     * @param {string} [nodeId] - TreeNode id to refresh\n     */\n    refresh: function(nodeId) {\n        nodeId = nodeId || this.getRootNodeId();\n        this._draw(nodeId);\n    },\n\n    /**\n     * Traverse this tree iterating over all nodes.\n     * @api\n     * @param {Function} iteratee - Iteratee function\n     * @param {object} [context] - Context of iteratee\n     * @example\n     * tree.eachAll(function(node, nodeId) {\n     *     console.log(node.getId() === nodeId); // true\n     * });\n     */\n    eachAll: function(iteratee, context) {\n        this.model.eachAll(iteratee, context);\n    },\n\n    /**\n     * Traverse this tree iterating over all descendants of a node.\n     * @api\n     * @param {Function} iteratee - Iteratee function\n     * @param {string} parentId - Parent node id\n     * @param {object} [context] - Context of iteratee\n     * @example\n     * tree.each(function(node, nodeId) {\n     *     console.log(node.getId() === nodeId); // true\n     * }, parentId);\n     *\n     */\n    each: function(iteratee, parentId, context) {\n        this.model.each(iteratee, parentId, context);\n    },\n\n    /**\n     * Add node(s).\n     * - If the parentId is falsy, the node will be appended to rootNode.\n     * - If 'isSilent' is not true, it redraws the tree\n     * @api\n     * @param {Array|object} data - Raw-data\n     * @param {*} [parentId] - Parent id\n     * @param {boolean} [isSilent] - If true, it doesn't redraw children\n     * @returns {Array.&lt;string>} Added node ids\n     * @example\n     * // add node with redrawing\n     * var firstAddedIds = tree.add({text:'FE development team1'}, parentId);\n     * console.log(firstAddedIds); // [\"tui-tree-node-10\"]\n     *\n     * // add node without redrawing\n     * var secondAddedIds = tree.add([\n     *    {text: 'FE development team2'},\n     *    {text: 'FE development team3'}\n     * ], parentId, true);\n     * console.log(secondAddedIds); // [\"tui-tree-node-11\", \"tui-tree-node-12\"]\n     */\n    add: function(data, parentId, isSilent) {\n        return this.model.add(data, parentId, isSilent);\n    },\n\n    /**\n     * Reset all data\n     * @api\n     * @param {Array|object} data - Raw data for all nodes\n     * @returns {Array.&lt;string>} Added node ids\n     * @example\n     * tree.resetAllData([\n     *  {text: 'hello', children: [\n     *      {text: 'foo'},\n     *      {text: 'bar'}\n     *  ]},\n     *  {text: 'wolrd'}\n     * ]);\n     */\n    resetAllData: function(data) {\n        this.removeAllChildren(this.getRootNodeId(), true);\n\n        return this.add(data);\n    },\n\n    /**\n     * Remove all children\n     * @api\n     * @param {string} nodeId - Parent node id\n     * @param {boolean} [isSilent] - If true, it doesn't redraw the node\n     * @example\n     * tree.removeAllChildren(nodeId); // Redraws the node\n     * tree.removeAllChildren(nodId, true); // Doesn't redraw the node\n     */\n    removeAllChildren: function(nodeId, isSilent) {\n        var children = this.getChildIds(nodeId);\n\n        tui.util.forEach(children, function(childId) {\n            this.remove(childId, true);\n        }, this);\n\n        if (!isSilent) {\n            this._draw(nodeId);\n        }\n    },\n\n    /**\n     * Remove a node with children.\n     * - If 'isSilent' is not true, it redraws the tree\n     * @api\n     * @param {string} nodeId - Node id to remove\n     * @param {boolean} [isSilent] - If true, it doesn't redraw children\n     * @example\n     * tree.remove(myNodeId); // remove node with redrawing\n     * tree.remove(myNodeId, true); // remove node without redrawing\n     */\n    remove: function(nodeId, isSilent) {\n        this.model.remove(nodeId, isSilent);\n    },\n\n    /**\n     * Move a node to new parent\n     * - If 'isSilent' is not true, it redraws the tree\n     * @api\n     * @param {string} nodeId - Node id\n     * @param {string} newParentId - New parent id\n     * @param {number} index - Index number of selected node\n     * @param {boolean} [isSilent] - If true, it doesn't redraw children\n     * @example\n     * tree.move(myNodeId, newParentId); // mode node with redrawing\n     * tree.move(myNodeId, newParentId, true); // move node without redrawing\n     */\n    move: function(nodeId, newParentId, index, isSilent) {\n        this.isMovingNode = true;\n        this.model.move(nodeId, newParentId, index, isSilent);\n        this.isMovingNode = false;\n    },\n\n    /**\n     * Search node ids by passing the predicate check or matching data\n     * @api\n     * @param {Function|Object} predicate - Predicate or data\n     * @param {Object} [context] - Context of predicate\n     * @returns {Array.&lt;string>} Node ids\n     * @example\n     * // search from predicate\n     * var leafNodeIds = tree.search(function(node, nodeId) {\n     *     return node.isLeaf();\n     * });\n     * console.log(leafNodeIds); // ['tui-tree-node-3', 'tui-tree-node-5']\n     *\n     * // search from data\n     * var specialNodeIds = tree.search({\n     *     isSpecial: true,\n     *     foo: 'bar'\n     * });\n     * console.log(specialNodeIds); // ['tui-tree-node-5', 'tui-tree-node-10']\n     * console.log(tree.getNodeData('tui-tree-node-5').isSpecial); // true\n     * console.log(tree.getNodeData('tui-tree-node-5').foo); // 'bar'\n     */\n    search: function(predicate, context) {\n        if (!snippet.isObject(predicate)) {\n            return [];\n        }\n\n        if (snippet.isFunction(predicate)) {\n            return this._filter(predicate, context);\n        }\n\n        return this._where(predicate);\n    },\n\n    /**\n     * Search node ids by matching data\n     * @param {Object} props - Data\n     * @returns {Array.&lt;string>} Node ids\n     * @private\n     */\n    _where: function(props) {\n        return this._filter(function(node) {\n            var result = true,\n                data = node.getAllData();\n\n            snippet.forEach(props, function(value, key) {\n                result = (key in data) &amp;&amp; (data[key] === value);\n\n                return result;\n            });\n\n            return result;\n        });\n    },\n\n    /**\n     * Search node ids by passing the predicate check\n     * @param {Function} predicate - Predicate\n     * @param {Object} [context] - Context of predicate\n     * @returns {Array.&lt;string>} Node ids\n     * @private\n     */\n    _filter: function(predicate, context) {\n        var filtered = [];\n\n        this.eachAll(function(node, nodeId) {\n            if (predicate(node, nodeId)) {\n                filtered.push(nodeId);\n            }\n        }, context);\n\n        return filtered;\n    },\n\n    /**\n     * Whether the node is leaf\n     * @api\n     * @param {string} nodeId - Node id\n     * @returns {boolean} True if the node is leaf.\n     */\n    isLeaf: function(nodeId) {\n        var node = this.model.getNode(nodeId);\n\n        return node &amp;&amp; node.isLeaf();\n    },\n\n    /**\n     * Whether a node is a ancestor of another node.\n     * @api\n     * @param {string} containerNodeId - Id of a node that may contain the other node\n     * @param {string} containedNodeId - Id of a node that may be contained by the other node\n     * @returns {boolean} Whether a node contains another node\n     */\n    contains: function(containerNodeId, containedNodeId) {\n        return this.model.contains(containedNodeId, containedNodeId);\n    },\n\n    /**\n     * Enable facility of tree\n     * @api\n     * @param {string} featureName - 'Selectable', 'Draggable', 'Editable', 'ContextMenu'\n     * @param {object} [options] - Feature options\n     * @returns {Tree} this\n     * @example\n     * tree\n     *  .enableFeature('Selectable', {\n     *      selectedClassName: 'tui-tree-selected'\n     *  })\n     *  .enableFeature('Editable', {\n     *      enableClassName: tree.classNames.textClass,\n     *      dataKey: 'text',\n     *      inputClassName: 'myInput'\n     *  })\n     *  .enableFeature('Draggable', {\n     *      useHelper: true,\n     *      helperPos: {x: 5, y: 2},\n     *      rejectedTagNames: ['UL', 'INPUT', 'BUTTON'],\n     *      rejectedClassNames: ['notDraggable', 'notDraggable-2'],\n     *      autoOpenDelay: 1500,\n     *      isSortable: true,\n     *      hoverClassName: 'tui-tree-hover'\n     *      lineClassName: 'tui-tree-line',\n     *      lineBoundary: {\n     *      \ttop: 10,\n     *       \tbottom: 10\n     *      }\n     *  })\n     *  .enableFeature('Checkbox', {\n     *      checkboxClassName: 'tui-tree-checkbox'\n     *  })\n     *  .enableFeature('ContextMenu, {\n     *  \tmenuData: [\n     *   \t\t{title: 'menu1', command: 'copy'},\n     *     \t\t{title: 'menu2', command: 'paste'},\n     *       \t{separator: true},\n     *        \t{\n     *         \t\ttitle: 'menu3',\n     *           \tmenu: [\n     *            \t\t{title: 'submenu1'},\n     *              \t{title: 'submenu2'}\n     *              ]\n     *          }\n     *      }\n     *  })\n     */\n    enableFeature: function(featureName, options) {\n        var Feature = features[featureName];\n\n        this.disableFeature(featureName);\n        if (Feature) {\n            this.enabledFeatures[featureName] = new Feature(this, options);\n        }\n\n        return this;\n    },\n\n    /**\n     * Disable facility of tree\n     * @api\n     * @param {string} featureName - 'Selectable', 'Draggable', 'Editable'\n     * @returns {Tree} this\n     * @example\n     * tree\n     *  .disableFeature('Selectable')\n     *  .disableFeature('Draggable')\n     *  .disableFeature('Editable')\n     *  .disableFeature('Checkbox')\n     *  .disableFeature('ContextMenu');\n     */\n    disableFeature: function(featureName) {\n        var feature = this.enabledFeatures[featureName];\n\n        if (feature) {\n            feature.destroy();\n            delete this.enabledFeatures[featureName];\n        }\n\n        return this;\n    },\n\n    /**\n     * Get index number of selected node\n     * @api\n     * @param {string} nodeId - Id of selected node\n     * @returns {number} Index number of attached node\n     */\n    getNodeIndex: function(nodeId) {\n        var parentId = this.model.getParentId(nodeId);\n\n        return this.model.getNode(parentId).getChildIndex(nodeId);\n    }\n});\n\n/**\n * Set abstract apis to tree prototype\n * @param {string} featureName - Feature name\n * @param {object} feature - Feature\n */\nfunction setAbstractAPIs(featureName, feature) {\n    var messageName = 'INVALID_API_' + featureName.toUpperCase(),\n        apiList = feature.getAPIList ? feature.getAPIList() : [];\n\n    snippet.forEach(apiList, function(api) {\n        Tree.prototype[api] = function() {\n            throw new Error(messages[messageName] || messages.INVALID_API);\n        };\n    });\n}\nsnippet.forEach(features, function(Feature, name) {\n    setAbstractAPIs(name, Feature);\n});\nsnippet.CustomEvents.mixin(Tree);\nmodule.exports = Tree;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"