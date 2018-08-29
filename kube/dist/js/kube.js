/*
	Kube UI Framework
	Version 7.1.1
	Updated: August 23, 2018

	http://imperavi.com/kube/

	Copyright (c) 2009-2018, Imperavi LLC.
	License: MIT
*/
(function() {
var Ajax = {};

Ajax.settings = {};
Ajax.post = function(options) { return new AjaxRequest('post', options); };
Ajax.get = function(options) { return new AjaxRequest('get', options); };

var AjaxRequest = function(method, options)
{
    var defaults = {
        method: method,
        url: '',
        before: function() {},
        success: function() {},
        error: function() {},
        data: false,
        async: true,
        headers: {}
    };

    this.p = this.extend(defaults, options);
    this.p = this.extend(this.p, Ajax.settings);
    this.p.method = this.p.method.toUpperCase();

    this.prepareData();

    this.xhr = new XMLHttpRequest();
    this.xhr.open(this.p.method, this.p.url, this.p.async);

    this.setHeaders();

    var before = (typeof this.p.before === 'function') ? this.p.before(this.xhr) : true;
    if (before !== false)
    {
        this.send();
    }
};

AjaxRequest.prototype = {
    extend: function(obj1, obj2)
    {
        if (obj2) for (var name in obj2) { obj1[name] = obj2[name]; }
        return obj1;
    },
    prepareData: function()
    {
        if (this.p.method === 'POST' && !this.isFormData()) this.p.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        if (typeof this.p.data === 'object' && !this.isFormData()) this.p.data = this.toParams(this.p.data);
        if (this.p.method === 'GET') this.p.url = (this.p.data) ? this.p.url + '?' + this.p.data : this.p.url;
    },
    setHeaders: function()
    {
        this.xhr.setRequestHeader('X-Requested-With', this.p.headers['X-Requested-With'] || 'XMLHttpRequest');
        for (var name in this.p.headers)
        {
            this.xhr.setRequestHeader(name, this.p.headers[name]);
        }
    },
    isFormData: function()
    {
        return (typeof window.FormData !== 'undefined' && this.p.data instanceof window.FormData);
    },
    isComplete: function()
    {
        return !(this.xhr.status < 200 || this.xhr.status >= 300 && this.xhr.status !== 304);
    },
    send: function()
    {
        if (this.p.async)
        {
            this.xhr.onload = this.loaded.bind(this);
            this.xhr.send(this.p.data);
        }
        else
        {
            this.xhr.send(this.p.data);
            this.loaded.call(this);
        }
    },
    loaded: function()
    {
        if (this.isComplete())
        {
            var response = this.xhr.response;
            var json = this.parseJson(response);
            response = (json) ? json : response;

            if (typeof this.p.success === 'function') this.p.success(response, this.xhr);
        }
        else
        {
            if (typeof this.p.error === 'function') this.p.error(this.xhr.statusText);
        }
    },
    parseJson: function(str)
    {
        try {
            var o = JSON.parse(str);
            if (o && typeof o === 'object')
            {
                return o;
            }

        } catch (e) {}

        return false;
    },
    toParams: function (obj)
    {
        return Object.keys(obj).map(
            function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]); }
        ).join('&');
    }
};
var DomCache = [0];
var DomExpando = 'data' + new Date();
var DomDisplayCache = {};
var DomHClass = 'is-hidden';
var DomHMClass = 'is-hidden-mobile';

var Dom = function(selector, context)
{
    return this.parse(selector, context);
};

Dom.ready = function(fn)
{
    if (document.readyState != 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
};

Dom.prototype = {
    get dom()
    {
        return true;
    },
    get length()
    {
        return this.nodes.length;
    },
    parse: function(selector, context)
    {
        var nodes;
        var reHtmlTest = /^\s*<(\w+|!)[^>]*>/;

        if (!selector)
        {
            nodes = [];
        }
        else if (selector.dom)
        {
            this.nodes = selector.nodes;
            return selector;
        }
        else if (typeof selector !== 'string')
        {
            if (selector.nodeType && selector.nodeType === 11)
            {
                nodes = selector.childNodes;
            }
            else
            {
                nodes = (selector.nodeType || selector === window) ? [selector] : selector;
            }
        }
        else if (reHtmlTest.test(selector))
        {
            nodes = this.create(selector);
        }
        else
        {
            nodes = this._query(selector, context);
        }

        this.nodes = this._slice(nodes);
    },
    create: function(html)
    {
        if (/^<(\w+)\s*\/?>(?:<\/\1>|)$/.test(html))
        {
            return [document.createElement(RegExp.$1)];
        }

        var elements = [];
        var container = document.createElement('div');
        var children = container.childNodes;

        container.innerHTML = html;

        for (var i = 0, l = children.length; i < l; i++)
        {
            elements.push(children[i]);
        }

        return elements;
    },

    // add
    add: function(nodes)
    {
        this.nodes = this.nodes.concat(this._toArray(nodes));
    },

    // get
    get: function(index)
    {
        return this.nodes[(index || 0)] || false;
    },
    getAll: function()
    {
        return this.nodes;
    },
    eq: function(index)
    {
        return new Dom(this.nodes[index]);
    },
    first: function()
    {
        return new Dom(this.nodes[0]);
    },
    last: function()
    {
        return new Dom(this.nodes[this.nodes.length - 1]);
    },
    contents: function()
    {
        return this.get().childNodes;
    },

    // loop
    each: function(callback)
    {
        var len = this.nodes.length;
        for (var i = 0; i < len; i++)
        {
            callback.call(this, (this.nodes[i].dom) ? this.nodes[i].get() : this.nodes[i], i);
        }

        return this;
    },

    // traversing
    is: function(selector)
    {
        return (this.filter(selector).length > 0);
    },
    filter: function (selector)
    {
        var callback;
        if (selector === undefined)
        {
            return this;
        }
        else if (typeof selector === 'function')
        {
            callback = selector;
        }
        else
        {
            callback = function(node)
            {
                if (selector instanceof Node)
                {
                    return (selector === node);
                }
                else if (selector && selector.dom)
                {
                    return ((selector.nodes).indexOf(node) !== -1);
                }
                else
                {
                    node.matches = node.matches || node.msMatchesSelector || node.webkitMatchesSelector;
                    return (node.nodeType === 1) ? node.matches(selector || '*') : false;
                }
            };
        }

        return new Dom(this.nodes.filter(callback));
    },
    not: function(filter)
    {
        return this.filter(function(node)
        {
            return !new Dom(node).is(filter || true);
        });
    },
    find: function(selector)
    {
        var nodes = [];
        this.each(function(node)
        {
            var ns = this._query(selector || '*', node);
            for (var i = 0; i < ns.length; i++)
            {
                nodes.push(ns[i]);
            }
        });

        return new Dom(nodes);
    },
    children: function(selector)
    {
        var nodes = [];
        this.each(function(node)
        {
            if (node.children)
            {
                var ns = node.children;
                for (var i = 0; i < ns.length; i++)
                {
                    nodes.push(ns[i]);
                }
            }
        });

        return new Dom(nodes).filter(selector);
    },
    parent: function(selector)
    {
        var nodes = [];
        this.each(function(node)
        {
            if (node.parentNode) nodes.push(node.parentNode);
        });

        return new Dom(nodes).filter(selector);
    },
    parents: function(selector, context)
    {
        context = this._getContext(context);

        var nodes = [];
        this.each(function(node)
        {
            var parent = node.parentNode;
            while (parent && parent !== context)
            {
                if (selector)
                {
                    if (new Dom(parent).is(selector)) { nodes.push(parent); }
                }
                else
                {
                    nodes.push(parent);
                }

                parent = parent.parentNode;
            }
        });

        return new Dom(nodes);
    },
    closest: function(selector, context)
    {
        context = this._getContext(context);
        selector = (selector.dom) ? selector.get() : selector;

        var nodes = [];
        var isNode = (selector && selector.nodeType);
        this.each(function(node)
        {
            do {
                if ((isNode && node === selector) || new Dom(node).is(selector)) return nodes.push(node);
            } while ((node = node.parentNode) && node !== context);
        });

        return new Dom(nodes);
    },
    next: function(selector)
    {
         return this._getSibling(selector, 'nextSibling');
    },
    nextElement: function(selector)
    {
        return this._getSibling(selector, 'nextElementSibling');
    },
    prev: function(selector)
    {
        return this._getSibling(selector, 'previousSibling');
    },
    prevElement: function(selector)
    {
        return this._getSibling(selector, 'previousElementSibling');
    },

    // css
    css: function(name, value)
    {
        if (value === undefined && (typeof name !== 'object'))
        {
            var node = this.get();
            if (name === 'width' || name === 'height')
            {
                return (node.style) ? this._getHeightOrWidth(name, node, false) + 'px' : undefined;
            }
            else
            {
                return (node.style) ? getComputedStyle(node, null)[name] : undefined;
            }
        }

        // set
        return this.each(function(node)
        {
            var obj = {};
            if (typeof name === 'object') obj = name;
            else obj[name] = value;

            for (var key in obj)
            {
                if (node.style) node.style[key] = obj[key];
            }
        });
    },

    // attr
    attr: function(name, value, data)
    {
        data = (data) ? 'data-' : '';

        if (value === undefined && (typeof name !== 'object'))
        {
            var node = this.get();
            if (node && node.nodeType !== 3)
            {
                return (name === 'checked') ? node.checked : this._getBooleanFromStr(node.getAttribute(data + name));
            }
            else return;
        }

        // set
        return this.each(function(node)
        {
            var obj = {};
            if (typeof name === 'object') obj = name;
            else obj[name] = value;

            for (var key in obj)
            {
                if (node.nodeType !== 3)
                {
                    if (key === 'checked') node.checked = obj[key];
                    else node.setAttribute(data + key, obj[key]);
                }
            }
        });
    },
    data: function(name, value)
    {
        if (name === undefined)
        {
            var reDataAttr = /^data\-(.+)$/;
            var attrs = this.get().attributes;

            var data = {};
            var replacer = function (g) { return g[1].toUpperCase(); };

            for (var key in attrs)
            {
                if (reDataAttr.test(attrs[key].nodeName))
                {
                    var dataName = attrs[key].nodeName.match(reDataAttr)[1];
                    var val = attrs[key].value;
                    dataName = dataName.replace(/-([a-z])/g, replacer);

                    if (this._isObjectString(val)) val = this._toObject(val);
                    else val = (this._isNumber(val)) ? parseFloat(val) : this._getBooleanFromStr(val);

                    data[dataName] = val;
                }
            }

            return data;
        }

        return this.attr(name, value, true);
    },
    val: function(value)
    {
        if (value === undefined)
        {
            var el = this.get();
            if (el.type && el.type === 'checkbox') return el.checked;
            else return el.value;
        }

        return this.each(function(node)
        {
            node.value = value;
        });
    },
    removeAttr: function(value)
    {
        return this.each(function(node)
        {
            var rmAttr = function(name) { if (node.nodeType !== 3) node.removeAttribute(name); };
            value.split(' ').forEach(rmAttr);
        });
    },
    removeData: function(value)
    {
        return this.each(function(node)
        {
            var rmData = function(name) { if (node.nodeType !== 3) node.removeAttribute('data-' + name); };
            value.split(' ').forEach(rmData);
        });
    },

    // dataset/dataget
    dataset: function(key, value)
    {
        return this.each(function(node)
        {
            DomCache[this.dataindex(node)][key] = value;
        });
    },
    dataget: function(key)
    {
        return DomCache[this.dataindex(this.get())][key];
    },
    dataindex: function(el)
    {
        var cacheIndex = el[DomExpando];
        var nextCacheIndex = DomCache.length;

        if (!cacheIndex)
        {
            cacheIndex = el[DomExpando] = nextCacheIndex;
            DomCache[cacheIndex] = {};
        }

        return cacheIndex;
    },

    // class
    addClass: function(value)
    {
        return this._eachClass(value, 'add');
    },
    removeClass: function(value)
    {
        return this._eachClass(value, 'remove');
    },
    toggleClass: function(value)
    {
        return this._eachClass(value, 'toggle');
    },
    hasClass: function(value)
    {
        return this.nodes.some(function(node)
        {
            return (node.classList) ? node.classList.contains(value) : false;
        });
    },

    // html & text
    empty: function()
    {
        return this.each(function(node)
        {
            node.innerHTML = '';
        });
    },
    html: function(html)
    {
        return (html === undefined) ? (this.get().innerHTML || '') : this.empty().append(html);
    },
    text: function(text)
    {
        return (text === undefined) ? (this.get().textContent || '') : this.each(function(node) { node.textContent = text; });
    },

    // manipulation
    after: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            if (typeof frag === 'string')
            {
                node.insertAdjacentHTML('afterend', frag);
            }
            else
            {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag).reverse();
                for (var i = 0; i < elms.length; i++)
                {
                    node.parentNode.insertBefore(elms[i], node.nextSibling);
                }
            }

            return node;

        });
    },
    before: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            if (typeof frag === 'string')
            {
                node.insertAdjacentHTML('beforebegin', frag);
            }
            else
            {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag);
                for (var i = 0; i < elms.length; i++)
                {
                    node.parentNode.insertBefore(elms[i], node);
                }
            }

            return node;
        });
    },
    append: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            if (typeof frag === 'string' || typeof frag === 'number')
            {
                node.insertAdjacentHTML('beforeend', frag);
            }
            else
            {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag);
                for (var i = 0; i < elms.length; i++)
                {
                    node.appendChild(elms[i]);
                }
            }

            return node;
        });
    },
    prepend: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            if (typeof frag === 'string' || typeof frag === 'number')
            {
                node.insertAdjacentHTML('afterbegin', frag);
            }
            else
            {
                var elms = (frag instanceof Node) ? [frag] : this._toArray(frag).reverse();
                for (var i = 0; i < elms.length; i++)
                {
                    node.insertBefore(elms[i], node.firstChild);
                }
            }

            return node;
        });
    },
    wrap: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            var wrapper = (typeof frag === 'string' || typeof frag === 'number') ? this.create(frag)[0] : (frag instanceof Node) ? frag : this._toArray(frag)[0];

            if (node.parentNode)
            {
                node.parentNode.insertBefore(wrapper, node);
            }

            wrapper.appendChild(node);

            return new Dom(wrapper);

        });
    },
    unwrap: function()
    {
        return this.each(function(node)
        {
            var $node = new Dom(node);

            return $node.replaceWith($node.contents());
        });
    },
    replaceWith: function(html)
    {
        return this._inject(html, function(frag, node)
        {
            var docFrag = document.createDocumentFragment();
            var elms = (typeof frag === 'string' || typeof frag === 'number') ? this.create(frag) : (frag instanceof Node) ? [frag] : this._toArray(frag);

            for (var i = 0; i < elms.length; i++)
            {
                docFrag.appendChild(elms[i]);
            }

            var result = docFrag.childNodes[0];
            node.parentNode.replaceChild(docFrag, node);

            return result;

        });
    },
    remove: function()
    {
        return this.each(function(node)
        {
            if (node.parentNode) node.parentNode.removeChild(node);
        });
    },
    clone: function(events)
    {
        var nodes = [];
        this.each(function(node)
        {
            var copy = this._clone(node);
            if (events) copy = this._cloneEvents(node, copy);
            nodes.push(copy);
        });

        return new Dom(nodes);
    },

    // show/hide
    show: function()
    {
        return this.each(function(node)
        {
            if (!node.style || this._getRealDisplay(node) !== 'none') return;

            var target = node.getAttribute('domTargetShow');
            var isHidden = (node.classList) ? node.classList.contains(DomHClass) : false;
            var isHiddenMobile = (node.classList) ? node.classList.contains(DomHMClass) : false;
            var type;

            if (isHidden)
            {
                type = DomHClass;
                node.classList.remove(DomHClass);
            }
            else if (isHiddenMobile)
            {
                type = DomHMClass;
                node.classList.remove(DomHMClass);
            }
            else
            {
                node.style.display = (target) ? target : 'block';
            }

            if (type) node.setAttribute('domTargetHide', type);
            node.removeAttribute('domTargetShow');

        }.bind(this));
    },
    hide: function()
    {
        return this.each(function(node)
        {
            if (!node.style || this._getRealDisplay(node) === 'none') return;

            var realDisplay = this._getRealDisplay(node);
            var target = node.getAttribute('domTargetHide');

            if (target === DomHClass)
            {
                node.classList.add(DomHClass);
            }
            else if (target === DomHMClass)
            {
                node.classList.add(DomHMClass);
            }
            else
            {
                if (realDisplay !== 'block') node.setAttribute('domTargetShow', realDisplay);
                node.style.display = 'none';
            }

            node.removeAttribute('domTargetHide');

        });
    },

    // dimensions
    scrollTop: function(value)
    {
        var node = this.get();
        var isWindow = (node === window);
        var isDocument = (node.nodeType === 9);
        var el = (isDocument) ? (document.scrollingElement || document.body.parentNode || document.body || document.documentElement) : node;

        if (value !== undefined)
        {
            if (isWindow) window.scrollTo(0, value);
            else el.scrollTop = value;
            return;
        }

        if (isDocument)
        {
            return (typeof window.pageYOffset != 'undefined') ? window.pageYOffset : ((document.documentElement.scrollTop) ? document.documentElement.scrollTop : ((document.body.scrollTop) ? document.body.scrollTop : 0));
        }
        else
        {
            return (isWindow) ? window.pageYOffset : el.scrollTop;
        }
    },
    offset: function()
    {
        return this._getDim('Offset');
    },
    position: function()
    {
        return this._getDim('Position');
    },
    width: function(value, adjust)
    {
        return this._getSize('width', 'Width', value, adjust);
    },
    height: function(value, adjust)
    {
        return this._getSize('height', 'Height', value, adjust);
    },
    outerWidth: function()
    {
        return this._getInnerOrOuter('width', 'outer');
    },
    outerHeight: function()
    {
        return this._getInnerOrOuter('height', 'outer');
    },
    innerWidth: function()
    {
        return this._getInnerOrOuter('width', 'inner');
    },
    innerHeight: function()
    {
        return this._getInnerOrOuter('height', 'inner');
    },

    // events
    click: function()
    {
        return this._triggerEvent('click');
    },
    focus: function()
    {
        return this._triggerEvent('focus');
    },
    trigger: function(names)
    {
        return this.each(function(node)
        {
            var events = names.split(' ');
            for (var i = 0; i < events.length; i++)
            {
                var ev;
                var opts = { bubbles: true, cancelable: true };

                try {
                    ev = new window.CustomEvent(events[i], opts);
                } catch(e) {
                    ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent(events[i], true, true);
                }

                node.dispatchEvent(ev);
            }
        });
    },
    on: function(names, handler, one)
    {
        return this.each(function(node)
        {
            var events = names.split(' ');
            for (var i = 0; i < events.length; i++)
            {
                var event = this._getEventName(events[i]);
                var namespace = this._getEventNamespace(events[i]);

                handler = (one) ? this._getOneHandler(handler, names) : handler;
                node.addEventListener(event, handler);

                node._e = node._e || {};
                node._e[namespace] = node._e[namespace] || {};
                node._e[namespace][event] = node._e[namespace][event] || [];
                node._e[namespace][event].push(handler);
            }

        });
    },
    one: function(events, handler)
    {
        return this.on(events, handler, true);
    },
    off: function(names, handler)
    {
        var testEvent = function(name, key, event) { return (name === event); };
        var testNamespace = function(name, key, event, namespace) { return (key === namespace); };
        var testEventNamespace = function(name, key, event, namespace) { return (name === event && key === namespace); };
        var testPositive = function() { return true; };

        if (names === undefined)
        {
            // ALL
            return this.each(function(node)
            {
                this._offEvent(node, false, false, handler, testPositive);
            });
        }

        return this.each(function(node)
        {
            var events = names.split(' ');

            for (var i = 0; i < events.length; i++)
            {
                var event = this._getEventName(events[i]);
                var namespace = this._getEventNamespace(events[i]);

                // 1) event without namespace
                if (namespace === '_events') this._offEvent(node, event, namespace, handler, testEvent);
                // 2) only namespace
                else if (!event && namespace !== '_events') this._offEvent(node, event, namespace, handler, testNamespace);
                // 3) event + namespace
                else this._offEvent(node, event, namespace, handler, testEventNamespace);
            }
        });
    },

    // form
    serialize: function(asObject)
    {
        var obj = {};
        var elms = this.get().elements;
        for (var i = 0; i < elms.length; i++)
        {
            var el = elms[i];
            if (/(checkbox|radio)/.test(el.type) && !el.checked) continue;
            if (!el.name || el.disabled || el.type === 'file') continue;

            if (el.type === 'select-multiple')
            {
                for (var z = 0; z < el.options.length; z++)
                {
                    var opt = el.options[z];
                    if (opt.selected) obj[el.name] = opt.value;
                }
            }

            obj[el.name] = (this._isNumber(el.value)) ? parseFloat(el.value) : this._getBooleanFromStr(el.value);
        }

        return (asObject) ? obj : this._toParams(obj);
    },
    ajax: function(success, error)
    {
        if (typeof AjaxRequest !== 'undefined')
        {
            var method = this.attr('method') || 'post';
            var options = {
                url: this.attr('action'),
                data: this.serialize(),
                success: success,
                error: error
            };

            return new AjaxRequest(method, options);
        }
    },

    // private
    _queryContext: function(selector, context)
    {
        context = this._getContext(context);

        return (context.nodeType !== 3 && typeof context.querySelectorAll === 'function') ? context.querySelectorAll(selector) : [];
    },
    _query: function(selector, context)
    {
        if (context)
        {
            return this._queryContext(selector, context);
        }
        else if (/^[.#]?[\w-]*$/.test(selector))
        {
            if (selector[0] === '#')
            {
                var element = document.getElementById(selector.slice(1));
                return element ? [element] : [];
            }

            if (selector[0] === '.')
            {
                return document.getElementsByClassName(selector.slice(1));
            }

            return document.getElementsByTagName(selector);
        }

        return document.querySelectorAll(selector);
    },
    _getContext: function(context)
    {
        context = (typeof context === 'string') ? document.querySelector(context) : context;

        return (context && context.dom) ? context.get() : (context || document);
    },
    _inject: function(html, fn)
    {
        var len = this.nodes.length;
        var nodes = [];
        while (len--)
        {
            var res = (typeof html === 'function') ? html.call(this, this.nodes[len]) : html;
            var el = (len === 0) ? res : this._clone(res);
            var node = fn.call(this, el, this.nodes[len]);

            if (node)
            {
                if (node.dom) nodes.push(node.get());
                else nodes.push(node);
            }
        }

        return new Dom(nodes);
    },
    _cloneEvents: function(node, copy)
    {
        var events = node._e;
        if (events)
        {
            copy._e = events;
            for (var name in events._events)
            {
                for (var i = 0; i < events._events[name].length; i++)
                {
                    copy.addEventListener(name, events._events[name][i]);
                }
            }
        }

        return copy;
    },
    _clone: function(node)
    {
        if (typeof node === 'undefined') return;
        if (typeof node === 'string') return node;
        else if (node instanceof Node) return node.cloneNode(true);
        else if ('length' in node)
        {
            return [].map.call(this._toArray(node), function(el) { return el.cloneNode(true); });
        }

        return node;
    },
    _slice: function(obj)
    {
        return (!obj || obj.length === 0) ? [] : (obj.length) ? [].slice.call(obj.nodes || obj) : [obj];
    },
    _eachClass: function(value, type)
    {
        return this.each(function(node)
        {
            if (value)
            {
                var setClass = function(name) { if (node.classList) node.classList[type](name); };
                value.split(' ').forEach(setClass);
            }
        });
    },
    _triggerEvent: function(name)
    {
        var node = this.get();
        if (node && node.nodeType !== 3) node[name]();
        return this;
    },
    _getOneHandler: function(handler, events)
    {
        var self = this;
        return function()
        {
            handler.apply(this, arguments);
            self.off(events);
        };
    },
    _getEventNamespace: function(event)
    {
        var arr = event.split('.');
        var namespace = (arr[1]) ? arr[1] : '_events';
        return (arr[2]) ? namespace + arr[2] : namespace;
    },
    _getEventName: function(event)
    {
        return event.split('.')[0];
    },
    _offEvent: function(node, event, namespace, handler, condition)
    {
        for (var key in node._e)
        {
            for (var name in node._e[key])
            {
                if (condition(name, key, event, namespace))
                {
                    var handlers = node._e[key][name];
                    for (var i = 0; i < handlers.length; i++)
                    {
                        if (typeof handler !== 'undefined' && handlers[i].toString() !== handler.toString())
                        {
                            continue;
                        }

                        node.removeEventListener(name, handlers[i]);
                        node._e[key][name].splice(i, 1);

                        if (node._e[key][name].length === 0) delete node._e[key][name];
                        if (Object.keys(node._e[key]).length === 0) delete node._e[key];
                    }
                }
            }
        }
    },
    _getInnerOrOuter: function(method, type)
    {
        return this[method](undefined, type);
    },
    _getDocSize: function(node, type)
    {
        var body = node.body, html = node.documentElement;
        return Math.max(body['scroll' + type], body['offset' + type], html['client' + type], html['scroll' + type], html['offset' + type]);
    },
    _getSize: function(type, captype, value, adjust)
    {
        if (value === undefined)
        {
            var el = this.get();
            if (el.nodeType === 3)      value = 0;
            else if (el.nodeType === 9) value = this._getDocSize(el, captype);
            else if (el === window)     value = window['inner' + captype];
            else                        value = this._getHeightOrWidth(type, el, adjust || 'normal');

            return Math.round(value);
        }

        return this.each(function(node)
        {
            value = parseFloat(value);
            value = value + this._adjustResultHeightOrWidth(type, node, adjust || 'normal');

            new Dom(node).css(type, value + 'px');

        }.bind(this));
    },
    _getHeightOrWidth: function(type, el, adjust)
    {
        if (!el) return 0;

        var name = type.charAt(0).toUpperCase() + type.slice(1);
        var style = getComputedStyle(el, null);
        var $el = new Dom(el);
        var result = 0;
        var $targets = $el.parents().filter(function(node)
        {
            return (getComputedStyle(node, null).display === 'none') ? node : false;
        });

        if (style.display === 'none') $targets.add(el);
        if ($targets.length !== 0)
        {
            var fixStyle = 'visibility: hidden !important; display: block !important;';
            var tmp = [];

            $targets.each(function(node)
            {
                var $node = new Dom(node);
                var thisStyle = $node.attr('style');
                if (thisStyle !== null) tmp.push(thisStyle);
                $node.attr('style', (thisStyle !== null) ? thisStyle + ';' + fixStyle : fixStyle);
            });

            result = $el.get()['offset' + name] - this._adjustResultHeightOrWidth(type, el, adjust);

            $targets.each(function(node, i)
            {
                var $node = new Dom(node);
                if (tmp[i] === undefined) $node.removeAttr('style');
                else $node.attr('style', tmp[i]);
            });
        }
        else
        {
            result = el['offset' + name] - this._adjustResultHeightOrWidth(type, el, adjust);
        }

        return result;
    },
    _adjustResultHeightOrWidth: function(type, el, adjust)
    {
        if (!el || adjust === false) return 0;

        var fix = 0;
        var style = getComputedStyle(el, null);
        var isBorderBox = (style.boxSizing === "border-box");

        if (type === 'height')
        {
            if (adjust === 'inner' || (adjust === 'normal' && isBorderBox))
            {
                fix += (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
            }

            if (adjust === 'outer') fix -= (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
        }
        else
        {
            if (adjust === 'inner' || (adjust === 'normal' && isBorderBox))
            {
                fix += (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.borderRightWidth) || 0);
            }

            if (adjust === 'outer') fix -= (parseFloat(style.marginLeft) || 0) + (parseFloat(style.marginRight) || 0);
        }

        return fix;
    },
    _getDim: function(type)
    {
        var node = this.get();
        return (node.nodeType === 3) ? { top: 0, left: 0 } : this['_get' + type](node);
    },
    _getPosition: function(node)
    {
        return { top: node.offsetTop, left: node.offsetLeft };
    },
    _getOffset: function(node)
    {
        var rect = node.getBoundingClientRect();
        var doc = node.ownerDocument;
		var docElem = doc.documentElement;
		var win = doc.defaultView;

		return {
			top: rect.top + win.pageYOffset - docElem.clientTop,
			left: rect.left + win.pageXOffset - docElem.clientLeft
		};
    },
    _getSibling: function(selector, method)
    {
        selector = (selector && selector.dom) ? selector.get() : selector;

        var isNode = (selector && selector.nodeType);
        var sibling;

        this.each(function(node)
        {
            while (node = node[method])
            {
                if ((isNode && node === selector) || new Dom(node).is(selector))
                {
                    sibling = node;
                    return;
                }
            }
        });

        return new Dom(sibling);
    },
    _toArray: function(obj)
    {
        if (obj instanceof NodeList)
        {
            var arr = [];
            for (var i = 0; i < obj.length; i++)
            {
                arr[i] = obj[i];
            }

            return arr;
        }
        else if (obj === undefined) return [];
        else
        {
            return (obj.dom) ? obj.nodes : obj;
        }
    },
    _toParams: function(obj)
    {
        var params = '';
        for (var key in obj)
        {
            params += '&' + this._encodeUri(key) + '=' + this._encodeUri(obj[key]);
        }

        return params.replace(/^&/, '');
    },
    _toObject: function(str)
    {
        return (new Function("return " + str))();
    },
    _encodeUri: function(str)
    {
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
    },
    _isNumber: function(str)
    {
        return !isNaN(str) && !isNaN(parseFloat(str));
    },
    _isObjectString: function(str)
    {
        return (str.search(/^{/) !== -1);
    },
    _getBooleanFromStr: function(str)
    {
        if (str === 'true') return true;
        else if (str === 'false') return false;

        return str;
    },
    _getRealDisplay: function(elem)
    {
        if (elem.currentStyle) return elem.currentStyle.display;
        else if (window.getComputedStyle)
        {
            var computedStyle = window.getComputedStyle(elem, null);
            return computedStyle.getPropertyValue('display');
        }
    }
};
// Init
var $K = {};
$K.app = false;
$K.init = function(options)
{
    return new KubeApp(options, [].slice.call(arguments, 1));
};

// Globals
$K.version = '7.1.1';
$K.options = {};
$K.modules = {};
$K.services = {};
$K.classes = {};
$K.mixins = {};
$K.lang = {};
$K.dom = function(selector, context) { return new Dom(selector, context); };
$K.ajax = Ajax;
$K.Dom = Dom;
$K.ready = Dom.ready;
$K.env = {
    'module': 'modules',
    'service': 'services',
    'class': 'classes',
    'mixin': 'mixins'
};

// Class
var KubeApp = function(options, args)
{
    return ($K.app = new App(options));
};

// get
$K.getApp = function()
{
    return ($K.app) ? $K.app : $K.init();
};

// api
$K.api = function(name)
{
    var app = $K.getApp();
    var args = [].slice.call(arguments, 1);
    args.unshift(name);
    app.api.apply(app, args);
};

// add
$K.add = function(type, name, obj)
{
    if (typeof $K.env[type] === 'undefined') return;

    // translations
    if (obj.translations)
    {
        $K.lang = $K.extend(true, {}, $K.lang, obj.translations);
    }

    // inherits
    if (type === 'mixin')
    {
        $K[$K.env[type]][name] = obj;
    }
    else
    {
        // prototype
        var F = function() {};
        F.prototype = obj;

        // mixing
        if (obj.mixing)
        {
            for (var i = 0; i < obj.mixing.length; i++)
            {
                $K.inherit(F, $K.mixins[obj.mixing[i]]);
            }
        }

        $K[$K.env[type]][name] = F;
    }
};

// add lang
$K.addLang = function(lang, obj)
{
    if (typeof $K.lang[lang] === 'undefined')
    {
        $K.lang[lang] = {};
    }

    $K.lang[lang] = $K.extend($K.lang[lang], obj);
};

// create
$K.create = function(name)
{
    var arr = name.split('.');
    var args = [].slice.call(arguments, 1);

    var type = 'classes'
    if (typeof $K.env[arr[0]] !== 'undefined')
    {
        type = $K.env[arr[0]];
        name = arr.slice(1).join('.');
    }

    // construct
    var instance = new $K[type][name]();

    // init
    if (instance.init)
    {
        var res = instance.init.apply(instance, args);

        return (res) ? res : instance;
    }

    return instance;
};

// inherit
$K.inherit = function(current, parent)
{
    parent = parent.prototype || parent;

    var F = function () {};
    F.prototype = parent;
    var f = new F();

    for (var prop in current.prototype)
    {
        if (current.prototype.__lookupGetter__(prop)) f.__defineGetter__(prop, current.prototype.__lookupGetter__(prop));
        else f[prop] = current.prototype[prop];
    }

    current.prototype = f;
    current.prototype.super = parent;

    return current;
};

// error
$K.error = function (exception)
{
    throw exception;
};

// extend
$K.extend = function()
{
    var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;

    if (Object.prototype.toString.call( arguments[0] ) === '[object Boolean]')
    {
        deep = arguments[0];
        i++;
    }

    var merge = function(obj)
    {
        for (var prop in obj)
        {
            if (Object.prototype.hasOwnProperty.call(obj, prop))
            {
                if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') extended[prop] = $K.extend(true, extended[prop], obj[prop]);
                else extended[prop] = obj[prop];
            }
        }
    };

    for (; i < length; i++ )
    {
        var obj = arguments[i];
        merge(obj);
    }

    return extended;
};
var Module = function(app, $el, name, id)
{
    this.app = app;

    // local
    this.eventTypes = ['click', 'mouseover', 'mouseout', 'mousedown', 'mouseup', 'mousemove',
                       'keydown', 'keyup', 'submit', 'change', 'contextmenu', 'input'];

    // build
    return this.build($el, name, id);
};

Module.prototype = {
    build: function($el, name, id)
    {
        var instance = $el.dataget('kube-instance-' + name);
        if (!instance && typeof $K.modules[name] !== 'undefined')
        {
            var context = new Context(this.app, $el, name, id);
            var $target = context.getTarget();

            instance = $K.create('module.' + name, this.app, context);

            $el.dataset('kube-instance-' + name, instance);
            $el.attr('data-loaded', true);

            // delegate events
            this._delegateModuleEvents(instance, $el, name);

            // delegate commands
            this._delegateModuleCommands(instance, $el, name);

            if ($target.is())
            {
                this._delegateModuleCommands(instance, $target, name);
            }
        }

        return instance;
    },

    _delegateModuleCommands: function(instance, $el, name)
    {
        $el.find('[data-command]').each(function(node)
        {
            var scope = node.getAttribute('data-scope');
            if (!scope || scope === name)
            {
                this._delegateCommand(instance, name, node, node.getAttribute('data-command'));
            }

        }.bind(this));
    },
    _delegateCommand: function(instance, name, node, command)
    {
        var self = this;
        var $node = $K.dom(node);
        $node.on('click.generatedcommand', function(e)
        {
            e.preventDefault();

            var args = $node.data();
            self.app.broadcast(name + '.' + command, instance, $node, args);
        });
    },

    _delegateModuleEvents: function(instance, $el, name)
    {
        $el.find('[data-type]').each(function(node)
        {
            var scope = node.getAttribute('data-scope');
            if (!scope || scope === name)
            {
                this._delegateEvent(instance, name, node, node.getAttribute('data-type'));
            }

        }.bind(this));
    },
    _delegateEvent: function(instance, name, node, type)
    {
        if (typeof instance._eventNodes === 'undefined')
        {
            instance._eventNodes = [];
        }

        var $node = $K.dom(node);
        var callback = function(e, eventType, element, type, args)
        {
            return instance['on' + eventType].call(instance, e, element, type, args);
        };

        instance._eventNodes.push($node);

        for (var i = 0; i < this.eventTypes.length; i++)
        {
            var event = 'on' + this.eventTypes[i];
            if (typeof instance[event] === 'function')
            {
                $node.on(this.eventTypes[i] + '.generatedevent', function(e)
                {
                    var args = $node.data();
                    callback(e, e.type, this, type, args);
                });
            }
        }
    }
};
var Context = function(app, $el, name, id)
{
    this.app = app;
    this.opts = app.opts;

    // build
    this.moduleName = name;
    this.$element = this._buildElement($el);
    this.params = this._buildParams();
    this.name = this._buildName();
    this.$target = this._buildTarget();
};

Context.prototype = {
    // public
    getElement: function()
    {
        return this.$element;
    },
    getTarget: function()
    {
        return this.$target;
    },
    getParams: function(defaults)
    {
        return (defaults) ? $K.extend({}, defaults, this.params) : this.params;
    },
    getName: function()
    {
        return this.name;
    },
    // private
    _buildName: function()
    {
        return (this.params.name) ? this.params.name : this.$element.attr('id');
    },
    _buildParams: function()
    {
        return $K.create('service.options', this.app, 'element', this.$element);
    },
    _buildElement: function($el)
    {
        return new KubeElement(this.app, $el, this.moduleName);
    },
    _buildTarget: function()
    {
        return new Target(this.app, this.params.target, this.moduleName);
    }
};
var KubeElement = function(app, $el, moduleName)
{
    this.app = app;
    this.utils = app.utils;
    this.parse($el);
};

KubeElement.prototype = {
    isOpened: function()
    {
        return !this.isClosed();
    },
    isClosed: function()
    {
        return (this.hasClass('is-hidden') || this.css('display') === 'none');
    }
};

$K.inherit(KubeElement, Dom);
var Target = function(app, selector, moduleName)
{
    this.app = app;
    this.utils = app.utils;
    this.parse(selector);
};

Target.prototype = {
    isOpened: function()
    {
        return !this.isClosed();
    },
    isClosed: function()
    {
        var self = this;
        var count = 0;
        var len = this.length;
        this.each(function(node)
        {
            var $node = $K.dom(node);
            if ($node.hasClass('is-hidden') || $node.css('display') === 'none')
            {
                count++;
            }
        });

        return (count === len);
    }
};

$K.inherit(Target, Dom);
var App = function(options)
{
    this.module = {};
    this.services = [];
    this.servicesIndex = 0;

    // start/stop
    this.started = false;
    this.stopped = false;

    this.rootOpts = options;
    this.$win = $K.dom(window);
    this.$doc = $K.dom(document);
    this.$body = $K.dom('body');

    // core services
    this.utils = $K.create('service.utils', this);
    this.opts = $K.create('service.options', this, 'global', options);
    this.lang = $K.create('service.lang', this);

    // build
    this.buildServices();
    this.buildModules();

    // start
    this.start();
};

App.prototype = {
    // start
    start: function()
    {
        this.stopped = false;
        this.broadcast('start');

        // start services & modules
        this.startStopServices('start');
        this.startStopModules('start');

        this.broadcast('started');
        this.started = true;
    },
    stop: function()
    {
        this.started = false;
        this.stopped = true;
        this.broadcast('stop');

        // stop services & modules
        this.startStopServices('stop');
        this.startStopModules('stop');

        this.broadcast('stopped');

        // stop app
        $K.app = false;
    },
    startStopServices: function(type)
    {
        for (var i = 0; i < this.services.length; i++)
        {
            this.callInstanceMethod(this.services[i], type);
        }
    },
    startStopModules: function(type)
    {
        for (var moduleName in this.module)
        {
            for (var key in this.module[moduleName])
            {
                var instance = this.module[moduleName][key];

                this.callInstanceMethod(instance, type);
                this.stopModuleEvents(instance, type);
            }
        }
    },
    stopModuleEvents: function(instance, type)
    {
        if (type === 'stop' && typeof instance._eventNodes !== 'undefined')
        {
            for (var z = 0; z < instance._eventNodes.length; z++)
            {
                instance._eventNodes[z].off('.generatedevent');
            }
        }
    },

    // started & stopped
    isStarted: function()
    {
        return this.started;
    },
    isStopped: function()
    {
        return this.stopped;
    },

    // build
    buildServices: function()
    {
        var core = ['options', 'lang', 'utils'];
        var bindable = ['utils', 'opts', 'lang', '$win', '$doc', '$body'];
        for (var name in $K.services)
        {
            if (core.indexOf(name) === -1)
            {
                this[name] = $K.create('service.' + name, this);
                this[name].serviceName = name;
                this.services.push(name);
                bindable.push(name);
            }
        }

        // binding
        for (var i = 0; i < this.services.length; i++)
        {
            var service = this.services[i];
            for (var z = 0; z < bindable.length; z++)
            {
                var inj = bindable[z];
                if (service !== inj)
                {
                    this[service][inj] = this[inj];
                }
            }
        }
    },
    buildModules: function()
    {
        this.$doc.find('[data-kube]').each(function(node, i)
        {
            var $el = $K.dom(node);
            var name = $el.attr('data-kube');
            var id = ($el.attr('id')) ? $el.attr('id') : name + '-' + i;
            id = ($el.attr('data-name')) ? $el.attr('data-name') : id;
            var instance = new Module(this, $el, name, id);
            instance.moduleName = name;

            this.storeModule(instance, name, id);
            this.servicesIndex++;

        }.bind(this));
    },
    storeModule: function(instance, name, id)
    {
        if (instance)
        {
            if (typeof this.module[name] === 'undefined')
            {
                this.module[name] = {};
            }

            this.module[name][id] = instance;
        }
    },

    // messaging
    broadcast: function(name, module)
    {
        var args = [].slice.call(arguments, 2);
        args.unshift(module);

        this.doBroadcast(name, args);

        if (module && typeof module.context !== 'undefined')
        {
            var elementName = module.context.getName();
            var arr = name.split('.');
            this.doBroadcast(arr[0] + '.' + elementName + '.' + arr[1], args);
        }
    },
    doBroadcast: function(name, args)
    {
        for (var moduleName in this.module)
        {
            for (var key in this.module[moduleName])
            {
                var instance = this.module[moduleName][key];
                this.callEventHandler(instance, name, args);
            }
        }
    },
    callEventHandler: function(instance, name, args)
    {
        name = name.replace('-', '');

        var arr = name.split('.');
        if (arr.length === 1)
        {
            if (typeof instance['on' + name] === 'function')
            {
                instance['on' + name].apply(instance, args);
            }
        }
        else
        {
            arr[0] = 'on' + arr[0];
            var func = this.utils.checkProperty(instance, arr);
            if (typeof func === 'function')
            {
                func.apply(instance, args);
            }
        }
    },

    // api
    api: function(name)
    {
        var args = [].slice.call(arguments, 1);
        var arr = name.split('.');
        var method = (arr.length === 3) ? arr[2] : arr[1];
        var id = (arr.length === 3) ? arr[1] : false;

        this.doApi(arr[0], id, method, args);
    },
    doApi: function(moduleName, id, method, args)
    {
        if (typeof this.module[moduleName] === 'undefined') return;
        for (var key in this.module[moduleName])
        {
            if (id === false || id === key)
            {
                var instance = this.module[moduleName][key];
                this.callInstanceMethod(instance, method, args);
            }
        }
    },
    callInstanceMethod: function(instance, method, args)
    {
        if (typeof instance[method] === 'function')
        {
            return instance[method].apply(instance, args);
        }
    }
};
$K.add('mixin', 'dom', $K.Dom.prototype);
$K.add('service', 'animate', {
    init: function(app)
    {
        this.app = app;

        // local
        this.animationOpt = true;
    },
    run: function(element, animation, callback)
    {
        return new $K.AnimatePlay(this.app, element, animation, callback, this.animationOpt);
    },
    remove: function(element)
    {
        this.$el = $K.dom(element);
        var effect = this.$el.attr('kube-animate-effect');

		this.$el.hide();
        this.$el.removeClass(effect);
        this.$el.off('animationend webkitAnimationEnd');
    }
});

$K.AnimatePlay = function(app, element, animation, callback, animationOpt)
{
    this.hidableEffects = ['fadeOut', 'flipOut', 'slideUp', 'zoomOut', 'slideOutUp', 'slideOutRight', 'slideOutLeft'];
    this.prefix = 'kube-';
    this.prefixes = ['', '-webkit-'];

    this.utils = app.utils;
    this.$el = $K.dom(element);
    this.$body = $K.dom('body');
    this.callback = callback;
    this.animation = (!animationOpt) ? this._buildAnimationOff(animation) : animation;

    this._setHeight();

    // animate
    if (this._isAnimate()) this._animate();
    else                   this._toggle();
};

$K.AnimatePlay.prototype = {
    _setHeight: function()
    {
        if (this.animation === 'slideUp' || this.animation === 'slideDown')
        {
            this.$el.height(this.$el.height());
        }
    },
	_buildAnimationOff: function(animation)
	{
        return (this._isHidable(animation)) ? 'hide' : 'show';
	},
	_isAnimate: function()
	{
    	return (this.animation !== 'show' && this.animation !== 'hide');
	},
	_isHidable: function(effect)
	{
    	return (this.hidableEffects.indexOf(effect) !== -1);
	},
	_clean: function()
	{
    	this.$body.removeClass('is-no-scroll-x');
		this.$el.removeClass(this.prefix + this.animation);
		this.$el.removeAttr('kube-animate-effect');
	},
    _toggle: function()
    {
		if (this.animation === 'show') this.$el.show();
		else                           this.$el.hide();

		if (typeof this.callback === 'function') this.callback(this);
    },
	_animate: function()
	{
        this.$body.addClass('is-no-scroll-x');
        this.$el.show();

	    this.$el.addClass(this.prefix + this.animation);
	    this.$el.attr('kube-animate-effect', this.prefix + this.animation);
		this._complete();
	},
	_complete: function()
	{

		this.$el.one('animationend webkitAnimationEnd', function(e)
		{
    		if (this.$el.hasClass(this.prefix + this.animation)) this._clean();
			if (this._isHidable(this.animation)) this.$el.hide();

			if (this.animation === 'slideUp' || this.animation === 'slideDown') this.$el.css('height', '');
			if (typeof this.callback === 'function') this.callback(this.$el);

		}.bind(this));
	}
};
$K.add('service', 'transition', {
    init: function(app)
    {
        this.transitionOpt = true;
    },
    run: function(element, params)
    {
        return new $K.TransitionPlay(params, element, this.transitionOpt);

    },
    remove: function(element)
    {
        this.$el = $K.dom(element);

    	var classname = this.$el.attr('kube-transition-class');
        if (classname)
        {
            this.$el.removeClass(classname);
            this.$el.removeAttr('kube-transition-class');
        }

    	var css = this.$el.attr('kube-transition-css');
        if (css)
        {
            var names = css.split(',');
            for (var i = 0; i < names.length; i++)
            {
                this.$el.css(names[i], '');
            }

            this.$el.removeAttr('kube-transition-css');
        }

        this.$el.off('transitionend webkitTransitionEnd');
    }
});


$K.TransitionPlay = function(params, element, transitionOpt)
{
    this.$el = $K.dom(element);
    this.params = params;

    this._transition();
};

$K.TransitionPlay.prototype = {
 	_transition: function()
	{
	    if (this.params.classname)
	    {
    	    this.$el.addClass(this.params.classname);
    	    this.$el.attr('kube-transition-class', this.params.classname);
        }

	    if (this.params.css)
	    {
    	    this.$el.css(this.params.css);

    	    var names = [];
    	    for (var key in this.params.css)
    	    {
        	    names.push(key);
    	    }

    	    this.$el.attr('kube-transition-css', names.join(','))
        }

		this._complete();
	},
	_complete: function()
	{
		this.$el.one('transitionend webkitTransitionEnd', function(e)
		{
			if (typeof this.params.callback === 'function') this.params.callback(this.$el);

		}.bind(this));
	}
};
$K.add('service', 'lang', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;

        var lang = (this.opts.lang) ? this.opts.lang : 'en';

        // build
        this.vars = this.build(lang);
    },
	build: function(lang)
	{
    	lang = ($K.lang[lang] === undefined) ? 'en' : lang;

        return ($K.lang[lang] !== undefined) ? $K.lang[lang] : [];
	},
    rebuild: function(lang)
    {
        this.opts.lang = lang;
        this.vars = this.build(lang);
    },
    extend: function(obj)
    {
        this.vars = $K.extend(this.vars, obj);
    },
    parse: function(str)
    {
        if (str === undefined)
        {
            return '';
        }

        var matches = str.match(/## (.*?) ##/g);
        if (matches)
        {
            for (var i = 0; i < matches.length; i++)
            {
                var key = matches[i].replace(/^##\s/g, '').replace(/\s##$/g, '');
                str = str.replace(matches[i], this.get(key));
            }
        }

        return str;
    },
	get: function(name)
	{
		return (typeof this.vars[name] !== 'undefined') ? this.vars[name] : '';
	}
});
$K.add('service', 'options', {
    init: function(app, type, opts)
    {
        this.app = app;
        this.utils = app.utils;

        return (type === 'global') ? this._build(opts) : this._buildElement(opts);
    },
    _build: function(opts)
    {
        return (opts) ? this._extendFromElements(opts) : {};
    },
    _buildElement: function($el)
    {
		return $K.extend(
			{},
			$el.data()
		);
    },
    _extendFromElements: function(options)
    {
        return (options.hasOwnProperty('append')) ? this.utils.extendData(options, options['append']) : options;
    }
});
$K.add('service', 'response', {
    init: function(app)
    {
        this.app = app;
    },
    // public
    parse: function(str)
    {
    	if (str === '') return false;

		var obj = (typeof str === 'object') ? str : JSON.parse(str);
		if (obj[0] !== undefined)
		{
			for (var item in obj)
			{
				this._parseItem(obj[item]);
			}
		}
		else
		{
			this._parseItem(obj);
		}

		return obj;
    },
    // private
	_parseItem: function(item)
	{
		if (item.type === 'location')
		{
			top.location.href = item.data;
		}
		else if (item.type === 'message')
		{
			this.message.show(item.data);
		}
		else
		{
    		for (var key in item.data)
    		{
        		var val = item.data[key];
        		var $el = $K.dom(key);

        		if (item.type === 'value')
        		{
        			val = (val === null || val === false) ? 0 : val;
        			val = (val === true) ? 1 : val;

    				$el.val(val);
				}
				else if (item.type === 'html')
                {
                    val = (val === null || val === false) ? '' : val;

    				$el.html(this._stripslashes(val));
				}
        		else if (item.type === 'addClass')
        		{
            		$el.addClass(val);
                }
        		else if (item.type === 'removeClass')
        		{
            		$el.removeClass(val);
                }
        		else if (item.type === 'show')
        		{
            		$el.removeClass('is-hidden');
        		}
        		else if (item.type === 'hide')
        		{
            		$el.addClass('is-hidden');
        		}
        		else if (item.type === 'animate')
        		{
                    this.animate.run($el, val);
        		}
			}
        }

		return item;
	},
    _stripslashes: function(str)
	{
		return (str+'').replace(/\0/g, '0').replace(/\\([\\'"])/g, '$1');
    }
});
$K.add('service', 'progress', {
    init: function(app)
    {
        this.app = app;
        this.$body = app.$body;

        // defaults
        this.defaults = {
            selector: 'kube-progress',
            target: false,
            value: 100
        }

        // local
        this.$progress = false;
        this.$progressBar = false;
    },
    // public
    stop: function()
    {
        this.$progress = false;
        this.$progressBar = false;

        $K.dom('#' + this.params.selector).remove();

        if (this.params.target)
        {
            var $target = $K.dom(this.params.target);
            $target.removeClass('is-relative');
        }
    },
    show: function(params)
    {
        this._buildDefaults(params);
        this._build();
    },
    hide: function(params)
    {
        if (this.$progress)
        {
            this._buildDefaults(params);
            this.animate.run(this.$progress, 'fadeOut', this.stop.bind(this));
        }
    },
    update: function(params)
    {
        this._buildDefaults(params);

        if (!this.$progress) this._build();
        this._setValue();
    },

    // private
    _buildDefaults: function(data)
    {
         this.params = $K.extend({}, this.defaults, data);
    },
    _build: function()
    {
        this.stop();

        this.$progress = $K.dom('<div>');
        this.$progress.attr('id', this.params.selector);
        this.$progress.addClass(this.params.selector);

        this.$progressBar = $K.dom('<span>');
        this.$progress.append(this.$progressBar);

        if (this.params.target)
        {
            var $target = $K.dom(this.params.target);
            if ($target.css('position') === 'static')
            {
                $target.addClass('is-relative');
            }

            $target.append(this.$progress);
        }
        else
        {
            this.$progress.addClass('is-fixed');
            this.$body.append(this.$progress);
        }
    },
    _setValue: function()
    {
        this.$progressBar.css('width', this.params.value + '%');
    }
});
$K.add('service', 'message', {
    init: function(app)
    {
        this.app = app;

        // defaults
        this.defaults = {
            name: false,
            delay: 7, // seconds
            message: '',
            position: 'right', // left, centered, line
            positions: ['is-left', 'is-right', 'is-center', 'is-centered', 'is-line'],
            type: false,
            types: ['is-error', 'is-success', 'is-focus', 'is-black'],
            selector: 'kube-message'
        };

        // animation
        this.currentAnimation = [];
        this.animation = {
            line: ['slideInDown', 'slideOutUp'],
            centered: ['slideInDown', 'slideOutUp'],
            left: ['slideInLeft', 'slideOutLeft'],
            right: ['slideInRight', 'slideOutRight']
        };

        // local
        this.$message = false;
        this.timeout = false;
    },
    // public
    stop: function()
    {
        clearTimeout(this.timeout);

        $K.dom('#' + this.params.selector).remove();

        this.$message = false;
        this.$doc.off('.kube.message');
    },
    show: function(params)
    {
        this._buildDefaults(params);

        // stop
        this.stop();

        // build
        this._build();
        this._open();
    },
    hide: function(params)
    {
        this._buildDefaults(params);
        this._close();
    },
    // private
    _broadcast: function(message)
    {
        this.app.broadcast('message.' + message, this);

        if (this.params.name)
        {
            this.app.broadcast('message.' + this.params.name + '.' + message, this);
        }
    },
    _buildDefaults: function(data)
    {
         this.params = $K.extend({}, this.defaults, data);
    },
	_buildAnimation: function()
	{
        this.currentAnimation = this.animation[this.params.position];
	},
	_buildClose: function()
	{
        this.$message.on('click.kube.message', this._close.bind(this));
	},
	_buildType: function()
	{
        if (this.params.type)
        {
            this.$message.removeClass(this.params.types.join(' '));
            this.$message.addClass(this.params.type);
        }
	},
	_buildPosition: function()
	{
        this.$message.removeClass(this.params.positions.join(' '));
        this.$message.addClass('is-' + this.params.position);
	},
	_buildMessage: function()
	{
    	this.$message.html(this.params.message);
	},
	_build: function()
	{
        this.$message = $K.dom('<div>');
        this.$message.attr('id', this.params.selector);
        this.$message.addClass('message is-hidden');

        this.$body.append(this.$message);
	},
    _handleKeyboard: function(e)
	{
		if (e.which === 27) this._close();
	},
    _open: function()
    {
        this._broadcast('open');
        this._buildClose();
        this._buildType();
        this._buildPosition();
        this._buildAnimation();
        this._buildMessage();

        this.animate.run(this.$message, this.currentAnimation[0], this._opened.bind(this));
    },
    _close: function(e)
    {
        if (this.$message)
        {
            this._broadcast('close');
            this.animate.run(this.$message, this.currentAnimation[1], this._closed.bind(this));
        }
    },
    _opened: function()
    {
        this.$doc.on('keyup.kube.message', this._handleKeyboard.bind(this));
        this.timeout = setTimeout(this._close.bind(this), this.params.delay * 1000);

        this._broadcast('opened');
    },
    _closed: function()
    {
        this.stop();
        this._broadcast('closed');
    }
});
$K.add('service', 'modal', {
    init: function(app)
    {
        this.app = app;

        // defaults
        this.defaults = {
            target: false,
            name: false,
            url: false,
            title: false,
            width: '600px',
            height: false,
            handle: false,
            commands: false
        };

        // local
        this.$box = false;
        this.$modal = false;

	},
	// public
    stop: function()
    {
        if (this.$box)
        {
            this.$box.remove();
            this.$box = false;
            this.$modal = false;

            this.$doc.off('.kube.modal');
            this.$win.off('.kube.modal');
        }

        if (this.$overlay)
        {
            this.$overlay.remove();
        }
    },
	open: function(params)
	{
        this._buildDefaults(params);

        if (this.params.url)
        {
            this._openUrl();
        }
        else if (this.params.target)
        {
            this._openTarget();
        }
    },
    close: function()
	{
        this._close();
	},
    resize: function()
    {
        this.$modal.setWidth(this.params.width);
        this.$modal.updatePosition();
    },

    // private
    _broadcast: function(message)
    {
        this.app.broadcast('modal.' + message, this, this.$modal, this.$modalForm);

        if (this.params.name)
        {
            this.app.broadcast('modal.' + this.params.name + '.' + message, this, this.$modal, this.$modalForm);
        }
    },
    _isOpened: function()
    {
        return (this.$modal && this.$modal.hasClass('is-open'));
    },
    _openUrl: function()
    {
        $K.ajax.post({
            url: this.params.url,
            success: this._doOpen.bind(this)
        });
    },
    _openTarget: function()
    {
        var template = $K.dom(this.params.target).clone().html();
        this._doOpen(template);
    },
    _doOpen: function(template)
    {
        this.stop();

        if (!this._isDesktop())
        {
            document.activeElement.blur();
        }


        this._createModal(template);

        this._buildModalBox();
        this._buildOverlay();
        this._buildModal();
        this._buildModalForm();
        this._buildModalCommands();

        this.$modal.updatePosition();
        this._broadcast('open');

        this.animate.run(this.$box, 'fadeIn', this._opened.bind(this));
        this.animate.run(this.$overlay, 'fadeIn');
    },
    _opened: function()
    {
        this.$modal.addClass('is-open');
        this.$box.on('mousedown.kube.modal', this._close.bind(this));
        this.$doc.on('keyup.kube.modal', this._handleEscape.bind(this));
        this.$win.on('resize.kube.modal', this.resize.bind(this));
        this.$modal.getBody().find('input[type=text],input[type=url],input[type=email]').on('keydown.kube.modal', this._handleEnter.bind(this));

        this._broadcast('opened');
    },
    _close: function(e)
    {
        if (!this.$box || !this._isOpened()) return;

        if (e)
        {
            if (!this._needToClose(e.target))
            {
                return;
            }

            e.stopPropagation();
            e.preventDefault();
        }

        this._broadcast('close');

        this.animate.run(this.$box, 'fadeOut', this._closed.bind(this));
        this.animate.run(this.$overlay, 'fadeOut');
    },
    _closed: function()
    {
        this.$modal.removeClass('is-open');
        this.$box.off('.kube.modal');
        this.$doc.off('.kube.modal');
        this.$win.off('.kube.modal');

        this._broadcast('closed');
    },
    _createModal: function(template)
    {
        this.$modal = $K.create('class.modal.element', this.app, template);
    },
    _buildDefaults: function(data)
    {
         this.params = $K.extend({}, this.defaults, data);
    },
    _buildModalBox: function()
    {
        this.$box = $K.dom('<div>');
        this.$box.attr('id', 'kube-modal');
        this.$box.addClass('modal-box is-hidden');
        this.$box.html('');
        this.$body.append(this.$box);
    },
    _buildOverlay: function()
    {
        this.$overlay = $K.dom('#kube-overlay');
        if (this.$overlay.length === 0)
        {
            this.$overlay = $K.dom('<div>');
            this.$overlay.attr('id', 'kube-overlay');
            this.$overlay.addClass('overlay is-hidden');
            this.$body.prepend(this.$overlay);
        }
    },
    _buildModal: function()
    {
        this.$box.append(this.$modal);

        this.$modal.setTitle(this.params.title);
        this.$modal.setHeight(this.params.height);
        this.$modal.setWidth(this.params.width);
    },
    _buildModalCommands: function()
    {
        if (this.params.commands)
        {
            var commands = this.params.commands;
            var $footer = this.$modal.getFooter();
            for (var key in commands)
            {
                var $btn = $K.dom('<button>');

                $btn.html(commands[key].title);
                $btn.attr('data-command', key);

                if (typeof commands[key].classname !== 'undefined')
                {
                    $btn.addClass(commands[key].classname);
                }

                if (typeof commands[key].close !== 'undefined')
                {
                    $btn.attr('data-action', 'close');
                    $btn.on('click', this._close.bind(this));
                }
                else
                {
                    $btn.on('click', this._handleCommand.bind(this));
                }

                $footer.append($btn);
            }
        }
    },
    _buildModalForm: function()
    {
        this.$modalForm = $K.create('modal.form', this.app, this.$modal.getForm());
    },
    _needToClose: function(el)
    {
        var $target = $K.dom(el);
        if ($target.attr('data-action') === 'close' || this.$modal.isCloseNode(el) || $target.closest('.modal').length === 0)
        {
            return true;
        }

        return false;
    },
    _handleCommand: function(e)
    {
        var $btn = $K.dom(e.target).closest('button');
        var command = $btn.attr('data-command');

        if (command !== 'cancel') e.preventDefault();

        this._broadcast(command);
    },
    _handleEnter: function(e)
    {
        if (e.which === 13)
        {
            if (this.params.handle)
            {
                e.preventDefault();
                this._broadcast(this.params.handle);
            }
        }
    },
    _handleEscape: function(e)
    {
        if (e.which === 27) this._close();
    },
    _isDesktop: function()
    {
        return !/(iPhone|iPod|iPad|Android)/.test(navigator.userAgent);
    }
});

$K.add('class', 'modal.form', {
    mixing: ['dom'],
    init: function(app, element)
    {
        this.app = app;

        // build
        this.build(element);
    },

    // public
    build: function(element)
    {
        this.parse(element);
    },
    getData: function()
    {
        var data = {};
        this.find('[name]').each(function(node)
        {
            var $node = $K.dom(node);
            data[$node.attr('name')] = $node.val();
        });

        return data;
    },
    setData: function(data)
    {
        this.find('[name]').each(function(node)
        {
            var $node = $K.dom(node);
            var name = $node.attr('name');
            if (data.hasOwnProperty(name))
            {
                if (node.type && node.type === 'checkbox') node.checked = data[name];
                else $node.val(data[name]);
            }
        });
    },
    getItem: function(name)
    {
        return this.find('[name=' + name + ']');
    }
});
$K.add('class', 'modal.element', {
    mixing: ['dom'],
    init: function(app, template)
    {
        this.app = app;
        this.opts = app.opts;
        this.$win = app.$win;

        // init
        this._init(template);
    },

    // get
    getForm: function()
    {
        return this.find('form');
    },
    getHeader: function()
    {
        return this.$modalHeader;
    },
    getBody: function()
    {
        return this.$modalBody;
    },
    getFooter: function()
    {
        return this.$modalFooter;
    },

    // set
    setTitle: function(title)
    {
        if (title) this.$modalHeader.html(title);
    },
    setWidth: function(width)
    {
        width = (parseInt(width) >= this.$win.width()) ? '96%' : width;

        this.css('max-width', width);
    },
    setHeight: function(height)
    {
        if (height !== false) this.$modalBody.css('height', height);
    },

    // update
    updatePosition: function()
    {
        var width = this.width();
        this.css({ 'left': '50%', 'margin-left': '-' + (width/2) + 'px' });

        var windowHeight = this.$win.height();
        var height = this.height();
        var marginTop = (windowHeight/2 - height/2);

        if (height < windowHeight && marginTop !== 0)
        {
            this.css('margin-top', marginTop + 'px');
        }
    },

    // is
    isCloseNode: function(el)
    {
        return (el === this.$modalClose.get());
    },

    // private
    _init: function(template)
    {
        this._build();
        this._buildClose();
        this._buildHeader();
        this._buildBody();
        this._buildFooter();
        this._buildTemplate(template);
    },
    _build: function()
    {
        this.parse('<div>');
        this.addClass('modal');
        this.attr('dir', this.opts.direction);
    },
    _buildClose: function()
    {
        this.$modalClose = $K.dom('<span>');
        this.$modalClose.addClass('close');

        this.append(this.$modalClose);
    },
    _buildHeader: function()
    {
        this.$modalHeader = $K.dom('<div>');
        this.$modalHeader.addClass('modal-header');

        this.append(this.$modalHeader);
    },
    _buildBody: function()
    {
        this.$modalBody = $K.dom('<div>');
        this.$modalBody.addClass('modal-body');

        this.append(this.$modalBody);
    },
    _buildFooter: function()
    {
        this.$modalFooter = $K.dom('<div>');
        this.$modalFooter.addClass('modal-footer');

        this.append(this.$modalFooter);
    },
    _buildTemplate: function(template)
    {
        this.$modalBody.html(template);
    }
});
$K.add('service', 'observer', {
    init: function(app)
    {
        this.app = app;
        this.opts = app.opts;

        if (this._isObserve())
        {
            this._build();
        }
    },

    // private
    _isObserve: function()
    {
        return (typeof this.opts.observer !== 'undefined' && window.MutationObserver);
    },
    _build: function()
    {
        var self = this;
		var observer = new MutationObserver(function(mutations)
		{
			mutations.forEach(function(mutation)
			{
				var newNodes = mutation.addedNodes;
			    if (newNodes.length === 0 || (newNodes.length === 1 && newNodes.nodeType === 3))
			    {
				    return;
				}

                self._iterate();
			});
		});

		// pass in the target node, as well as the observer options
		observer.observe(document, {
			 subtree: true,
			 childList: true
		});
    },
    _iterate: function()
    {
        var self = this;
        var $nodes = $K.dom('[data-kube]').not('[data-loaded]');
		$nodes.each(function(node, i)
		{
    		var $el = $K.dom(node);
    		var name = $el.attr('data-kube');
            var id = ($el.attr('id')) ? $el.attr('id') : name + '-' + (self.app.servicesIndex + i);
            var instance = new Module(self.app, $el, name, id);

            self.app.storeModule(instance, name, id)
            self.app.callInstanceMethod(instance, 'start');
        });

        // $R
        if (typeof $R !== 'undefined')
        {
            $R('[data-redactor]');
        }
    }
});
$K.add('service', 'utils', {
    init: function(app)
    {
        this.app = app;
    },

    // string
    parseOptsString: function(str)
    {
        var properties = str.replace('{', '').replace('}', '').trim().replace(/;$/, '').split(';');
        var obj = {};
        properties.forEach(function(property) {
            var tup = property.split(':');
            obj[tup[0].trim()] = tup[1].trim().replace(/'/g, '');
        });

        return obj;
    },
    ucfirst: function(str)
    {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // object
    checkProperty: function(obj)
    {
        var args = (arguments[1] && Array.isArray(arguments[1])) ? arguments[1] : [].slice.call(arguments, 1);

        for (var i = 0; i < args.length; i++)
        {
            if (!obj || (typeof obj[args[i]] === 'undefined'))
            {
                return false;
            }

            obj = obj[args[i]];
        }

        return obj;
    },

    // data
    extendData: function(data, elements)
    {
        if (typeof elements === 'object')
        {
            data = $K.extend({}, data, elements);
        }
        else if (typeof elements === 'string')
        {
            var $elms = $K.dom(elements);
            $elms.each(function(node)
            {
                var $node = $K.dom(node);
                if (node.tagName === 'FORM')
                {
                    data = $K.extend({}, data, $node.serialize(true));
                }
                else
                {
                    var name = ($node.attr('name')) ? $node.attr('name') : $node.attr('id');
                    var val = $node.val();
                    data[name] = (this._isNumber(val)) ? parseFloat(val) : this._getBooleanFromStr(val);
                }
            });
        }

        return data;
    },
    _isNumber: function(str)
    {
        return !isNaN(str) && !isNaN(parseFloat(str));
    },
    _getBooleanFromStr: function(str)
    {
        if (str === 'true') return true;
        else if (str === 'false') return false;

        return str;
    }
});

    window.Kube = window.$K = $K;
}());
(function($K)
{
    $K.add('module', 'alert', {
        init: function(app, context)
        {
            this.app = app;
            this.animate = app.animate;

            // context
            this.context = context;
            this.$element = context.getElement();
        },
        // events
        onclick: function(e, element, type)
        {
            if (type === 'close')
            {
                this.close(e);
            }
        },
        // public
        open: function(e)
        {
            if (this.$element.isOpened()) return;
            if (e) e.preventDefault();

            this.app.broadcast('alert.open', this);
            this.animate.run(this.$element, 'fadeIn', this._opened.bind(this));
        },
        close: function(e)
        {
            if (this.$element.isClosed()) return;
            if (e) e.preventDefault();

            this.app.broadcast('alert.close', this);
            this.animate.run(this.$element, 'fadeOut', this._closed.bind(this));
        },

        // private
        _opened: function()
        {
            this.app.broadcast('alert.opened', this);
        },
        _closed: function()
        {
            this.app.broadcast('alert.closed', this);
        }
    });
})(Kube);
(function($K)
{
    $K.add('module', 'toggle', {
        init: function(app, context)
        {
            this.app = app;
            this.animate = app.animate;

            // defaults
            var defaults = {
                target: false
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
            this.$target = context.getTarget();
        },
        // public
        start: function()
        {
            this.$element.on('click.kube.toggle', this.toggle.bind(this));
        },
        stop: function()
        {
            this.$element.off('.kube.toggle');
        },
        toggle: function(e)
        {
            return (this.$target.isOpened()) ? this.close(e) : this.open(e);
        },
        open: function(e)
        {
            if (this.$target.isOpened()) return;
            if (e) e.preventDefault();

            this.app.broadcast('toggle.open', this);
            this.animate.run(this.$target, 'slideDown', this._opened.bind(this));
        },
        close: function(e)
        {
            if (this.$target.isClosed()) return;
            if (e) e.preventDefault();

            this.app.broadcast('toggle.close', this);
            this.animate.run(this.$target, 'slideUp', this._closed.bind(this));
        },

        // private
        _opened: function()
        {
            this.app.broadcast('toggle.opened', this);
        },
        _closed: function()
        {
            this.app.broadcast('toggle.closed', this);
        }
    });
})(Kube);
(function($K)
{
    $K.add('module', 'sticky', {
        init: function(app, context)
        {
            this.app = app;
            this.$win = app.$win;

            // defaults
            var defaults = {
                offset: 0 // string in pixels
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
        },
        start: function()
        {
            this.offsetTop = this._getOffsetTop();

    	    this._load();
    	    this.$win.on('scroll.kube.sticky', this._load.bind(this));
    	},
    	stop: function()
    	{
        	this.$win.off('scroll.kube.sticky');
        	this.$element.removeClass('fixed').css('top', '');
    	},
        // private
    	_load: function()
    	{
    		return (this._isFix()) ? this._setFixed() : this._setUnfixed();
    	},
    	_isFix: function()
    	{
            return (this.$win.scrollTop() > (this.offsetTop + parseInt(this.params.offset, 10)));
    	},
    	_setFixed: function()
    	{
    		this.$element.addClass('is-fixed').css('top', this.params.offset);
    		this.app.broadcast('sticky.fixed', this);
    	},
    	_setUnfixed: function()
    	{
    		this.$element.removeClass('is-fixed').css('top', '');
    		this.app.broadcast('sticky.unfixed', this);
        },
    	_getOffsetTop: function()
    	{
        	return this.$element.offset().top;
    	}
    });
})(Kube);
(function($K)
{
    $K.add('module', 'offcanvas', {
        init: function(app, context)
        {
            this.app = app;
            this.$doc = app.$doc;
            this.$body = app.$body;
            this.utils = app.utils;
            this.animate = app.animate;
            this.transition = app.transition;

            // defaults
            var defaults = {
                clickOutside: true,
                target: false
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
            this.$target = context.getTarget();

            // build
            this._build();
        },
        start: function()
        {
            this.$element.on('click.kube.offcanvas', this.toggle.bind(this));
        },
        stop: function()
        {
            this._clear();
        },
        toggle: function(e)
        {
            return (this.$target.isOpened()) ? this.close(e) : this.open(e);
        },
        open: function(e)
        {
            if (e)
            {
                e.stopPropagation();
                e.preventDefault();
            }

            this._clear();

            this.$body.addClass('is-no-scroll-x');
            this.$target.addClass('is-offcanvas');

            this.targetWidth = this.$target.width();

            this._resize();
            this.app.broadcast('offcanvas.open', this);

            return (this.isSlide) ? this._openSlide() : this._openPush();
        },
        close: function(e)
        {
            if (this.eventScroll) return;
            if (e)
            {
                var $el = $K.dom(e.target);
                var el = $el.get();
                var isClickable = (el.tagName === 'A' ||el.tagName === 'BUTTON');
            	if (!isClickable || el === this.$element.get())
                {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }

            this.app.broadcast('offcanvas.close', this);

            return (this.isSlide) ? this._closeSlide() : this._closePush();
        },
        // private
        _build: function()
        {
            this.isSlide = !(this.$target.hasClass('is-offcanvas-push'));
            this.slideDirection = (this.$target.hasClass('is-offcanvas-right')) ? 'Right' : 'Left';
            this.pushSign = (this.slideDirection === 'Left') ? '' : '-';
            this.eventScroll = false;
        },
        _handleKeyboard: function(e)
    	{
    		if (e.which === 27) this.close();
    	},

        _openSlide: function()
        {
            this.animate.run(this.$target, 'slideIn' + this.slideDirection, this._opened.bind(this));
        },
        _openPush: function()
        {
            this.$target.show();
            this._pushBody(this.pushSign + this.targetWidth + 'px', this._opened.bind(this));
        },
        _opened: function()
        {
            this.$doc.on('touchmove.kube.offcanvas', function() { this.eventScroll = true; }.bind(this));
            this.$doc.on('touchstart.kube.offcanvas', function() { this.eventScroll = false; }.bind(this));
            this.$doc.on('keyup.kube.offcanvas', this._handleKeyboard.bind(this));

            if (this.params.clickOutside)
            {
                this.$doc.on('click.kube.offcanvas touchend.kube.offcanvas', this.close.bind(this));
            }

            this.app.broadcast('offcanvas.opened', this);
        },
        _closeSlide: function()
        {
            this.animate.run(this.$target, 'slideOut' + this.slideDirection, this._closed.bind(this));
        },
        _closePush: function()
        {
            this._pushBody('0', this._closed.bind(this));
        },
        _closed: function()
        {
            this.$doc.off('.kube.offcanvas');
            this.$body.removeClass('is-no-scroll-x');
            this.transition.remove(this.$body);
            this.$target.removeClass('is-offcanvas');
            this.$target.hide();

            this.app.broadcast('offcanvas.closed', this);
        },
        _pushBody: function(transform, callback)
        {
            var params = {
                classname: 'is-offcanvasTransition',
                css: { transform: 'translateX(' + transform + ')' },
                callback: callback
            };

            this.transition.run(this.$body, params, callback);
        },
        _resize: function()
        {
            var resize = function()
            {
                this.$target.height(this.$doc.height());
            }.bind(this);

            resize();
            this.$doc.on('resize.kube.offcanvas', resize);
        },
        _clear: function()
        {
            this.$doc.off('.kube.offcanvas');
            this.transition.remove(this.$body);

            $K.dom('.is-offcanvas').each(function(node)
            {
                var $el = $K.dom(node);

                this.animate.remove($el);

                $el.hide();
                $el.removeClass('is-offcanvas');

            }.bind(this));
        }
    });
})(Kube);
(function($K)
{
    $K.add('module', 'tabs', {
        init: function(app, context)
        {
            this.app = app;
            this.$body = app.$body;

            // defaults
            var defaults = {
                equal: false
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();

            // local
            this.$boxes = $K.dom([]);
            this.$tabActive = false;
            this.$boxActive = false;
        },
        start: function()
        {
            this._buildControls();
            this._buildBoxes();
            this._setEqualBoxes();

            this._open();
        },
        stop: function()
        {
            this.$tabsControls.off('.kube.tabs');
        },
        // api
        getActiveTab: function()
        {
            return this.$tabActive;
        },
        getActiveBox: function()
        {
            return this.$boxActive;
        },
        // private
        _toggle: function(e)
        {
            if (e)
            {
                e.stopPropagation();
                e.preventDefault();
            }

            var $tab = $K.dom(e.target);
            var $box = this._getBox($tab);

            if ($tab.hasClass('is-active')) return;

            this._open($tab);
            this.app.broadcast('tabs.opened', this);
        },
        _buildControls: function()
        {
            this.$tabsControls = this.$element.find('a');
            this.$tabsControls.on('click.kube.tabs', this._toggle.bind(this));
        },
        _buildBoxes: function()
        {
            this.$tabsControls.each(function(node, i)
            {
                var $tab = $K.dom(node);
                var $box = this._getBox($tab);

                this.$boxes.add($box);

                if (i === 0) this.$tabActive = $tab;
                if ($tab.hasClass('is-active')) this.$tabActive = $tab;

            }.bind(this));
        },
        _open: function($tab)
        {
            this.$tabActive = ($tab) ? $tab : this.$tabActive;

            this.$tabsControls.removeClass('is-active');
            this.$tabActive.addClass('is-active');
            this.$boxActive = this._getBox(this.$tabActive);

            this.$boxes.addClass('is-hidden').removeClass('is-open');
            this.$boxActive.removeClass('is-hidden').addClass('is-open');
        },
        _getBox: function($tab)
        {
            return $K.dom($tab.attr('href'));
        },
        _setEqualBoxes: function()
    	{
        	if (!this.params.equal) return;

    		var minHeight = this._getItemMaxHeight() + 'px';

	    	this.$boxes.css('min-height', minHeight);
    	},
    	_getItemMaxHeight: function()
    	{
    		var max = 0;
    		this.$boxes.each(function(node)
    		{
        		var $node = $K.dom(node);
    			var h = $node.height();
    			max = (h > max) ? h : max;
    		});

    		return max;
    	}
    });
})(Kube);
(function($K)
{
    $K.add('module', 'dropdown', {
        init: function(app, context)
        {
            this.app = app;
            this.$doc = app.$doc;
            this.$win = app.$win;
            this.$body = app.$body;
            this.utils = app.utils;
            this.animate = app.animate;

            // defaults
            var defaults = {
                target: false
            };

            // context
            this.context = context;
            this.params = context.getParams(defaults);
            this.$element = context.getElement();
            this.$target = context.getTarget();

            // local
            this.animationOpen = 'slideDown';
            this.animationClose = 'slideUp';
        },
        // public
        start: function()
        {
            this.$element.on('click.kube.dropdown', this.toggle.bind(this));
        },
        stop: function()
        {
            this.animate.clear(this.$target);
            this.$target.hide();

            this.$element.off('.kube.dropdown');
            this.$doc.off('.kube.dropdown');
            this.$win.off('.kube.dropdown');
        },
        toggle: function(e)
        {
            return (this.$target.isOpened()) ? this.close(e) : this.open(e);
        },
        open: function(e)
        {
            if (this.$target.isOpened()) return;
            if (e)
            {
                e.stopPropagation();
                e.preventDefault();
            }

            this.$doc.off('.kube.dropdown');
            this.$win.off('.kube.dropdown');

            // hide all
            this.$body.find('.dropdown').each(function(node)
            {
                var $el = $K.dom(node);

                this.animate.remove($el);
                $el.hide();

            }.bind(this));

            this._openCaret();
            this._setPosition();

            this.$element.addClass('dropdown-in');
            this.app.broadcast('dropdown.open', this);
            this.animate.run(this.$target, this.animationOpen, this._opened.bind(this));
        },
        close: function(e)
        {
            if (this.$target.isClosed()) return;
            if (e)
            {
                var el = e.target;
                var $el = $K.dom(el);
                var isClickable = (el.tagName === 'A' || el.tagName === 'BUTTON');
                if (!isClickable || el === this.$element.get() || (el.tagName === 'A' && $el.hasClass('is-active')))
                {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }

            this.app.broadcast('dropdown.close', this);
            this.animate.run(this.$target, this.animationClose, this._closed.bind(this));
        },

        // private
    	_getElementPosition: function()
    	{
        	return (this.$element.closest('.is-fixed').length !== 0) ? this.$element.position() : this.$element.offset();
    	},
    	_getPlacement: function()
    	{
        	var pos = this._getElementPosition();
        	var height = parseFloat(this.$element.css('height')) + pos.top + parseFloat(this.$target.css('height'));
    		return (this.$doc.height() < height) ? 'top' : 'bottom';
    	},
    	_setPosition: function()
    	{
        	var elHeight = parseFloat(this.$element.css('height'));
            var pos = this._getElementPosition();
            var top = pos.top + elHeight;
            var left = pos.left;
            var height = parseFloat(this.$target.css('height'));
            var placement = this._getPlacement();
            var width = parseFloat(this.$target.css('width'));
            var borderWidth = parseFloat(this.$element.css('border-left-width')) + parseFloat(this.$element.css('border-right-width'));
            var leftFix = (this.$win.width() < (left + width)) ? (width - this.$element.width() - borderWidth) : 0;

            if (placement === 'top')
            {
                 top = top - height - elHeight;
                 this.animationOpen = 'show';
                 this.animationClose = 'hide';
            }
            else
            {
                 this.animationOpen = 'slideDown';
                 this.animationClose = 'slideUp';
            }

            this.$target.css({ 'top': top + 'px', 'left': (left - leftFix) + 'px' });
    	},
        _handleKeyboard: function(e)
    	{
    		if (e.which === 27) this.close();
    	},
        _opened: function()
        {
            this.$doc.on('keyup.kube.dropdown', this._handleKeyboard.bind(this));
            this.$doc.on('click.kube.dropdown touchstart.kube.dropdown', this.close.bind(this));
    		this.$doc.on('scroll.kube.dropdown', this._setPosition.bind(this));
    		this.$win.on('resize.kube.dropdown', this._setPosition.bind(this));

            this.app.broadcast('dropdown.opened', this);
        },
        _closed: function()
        {
            this.$doc.off('.kube.dropdown');
            this.$win.off('.kube.dropdown');

            this._closeCaret();
            this.$element.removeClass('dropdown-in');
            this.app.broadcast('dropdown.closed', this);
        },
        _openCaret: function()
        {
            var $caret = this.$element.find('.caret');
            $caret.removeClass('is-down').addClass('is-left');
        },
        _closeCaret: function()
        {
            var $caret = this.$element.find('.caret');
            $caret.removeClass('is-left').addClass('is-down');
        }
    });
})(Kube);
var tns = function () { var t = window, Ti = t.requestAnimationFrame || t.webkitRequestAnimationFrame || t.mozRequestAnimationFrame || t.msRequestAnimationFrame || function (t) { return setTimeout(t, 16) }, e = window, Ei = e.cancelAnimationFrame || e.mozCancelAnimationFrame || function (t) { clearTimeout(t) }; function ki() { for (var t, e, n, i = arguments[0] || {}, a = 1, r = arguments.length; a < r; a++)if (null !== (t = arguments[a])) for (e in t) i !== (n = t[e]) && void 0 !== n && (i[e] = n); return i } function Ni(t) { return 0 <= ["true", "false"].indexOf(t) ? JSON.parse(t) : t } function Bi(t, e, n, i) { return i && t.setItem(e, n), n } function Li() { var t = document, e = t.body; return e || ((e = t.createElement("body")).fake = !0), e } var n = document.documentElement; function Di(t) { var e = ""; return t.fake && (e = n.style.overflow, t.style.background = "", t.style.overflow = n.style.overflow = "hidden", n.appendChild(t)), e } function Ii(t, e) { t.fake && (t.remove(), n.style.overflow = e, n.offsetHeight) } function Oi(t, e, n, i) { "insertRule" in t ? t.insertRule(e + "{" + n + "}", i) : t.addRule(e, n, i) } function Si(t) { return ("insertRule" in t ? t.cssRules : t.rules).length } function Hi(t, e, n) { for (var i = 0, a = t.length; i < a; i++)e.call(n, t[i], i) } var i = "classList" in document.createElement("_"), Ri = i ? function (t, e) { return t.classList.contains(e) } : function (t, e) { return 0 <= t.className.indexOf(e) }, Pi = i ? function (t, e) { Ri(t, e) || t.classList.add(e) } : function (t, e) { Ri(t, e) || (t.className += " " + e) }, Wi = i ? function (t, e) { Ri(t, e) && t.classList.remove(e) } : function (t, e) { Ri(t, e) && (t.className = t.className.replace(e, "")) }; function zi(t, e) { return t.hasAttribute(e) } function r(t) { return void 0 !== t.item } function qi(t, e) { if (t = r(t) || t instanceof Array ? t : [t], "[object Object]" === Object.prototype.toString.call(e)) for (var n = t.length; n--;)for (var i in e) t[n].setAttribute(i, e[i]) } function ji(t, e) { t = r(t) || t instanceof Array ? t : [t]; for (var n = (e = e instanceof Array ? e : [e]).length, i = t.length; i--;)for (var a = n; a--;)t[i].removeAttribute(e[a]) } function Fi(t) { zi(t, "hidden") || qi(t, { hidden: "" }) } function Qi(t) { zi(t, "hidden") && ji(t, "hidden") } function Vi(t) { return 0 < t.offsetWidth && 0 < t.offsetHeight } function Xi(e) { if ("string" == typeof e) { var n = [e], i = e.charAt(0).toUpperCase() + e.substr(1);["Webkit", "Moz", "ms", "O"].forEach(function (t) { "ms" === t && "transform" !== e || n.push(t + i) }), e = n } for (var t = document.createElement("fakeelement"), a = (e.length, 0); a < e.length; a++) { var r = e[a]; if (void 0 !== t.style[r]) return r } return !1 } function Yi(t, e) { var n = !1; return /^Webkit/.test(t) ? n = "webkit" + e + "End" : /^O/.test(t) ? n = "o" + e + "End" : t && (n = e.toLowerCase() + "end"), n } var a = !1; try { var o = Object.defineProperty({}, "passive", { get: function () { a = !0 } }); window.addEventListener("test", null, o) } catch (t) { } var s = !!a && { passive: !0 }; function Ki(t, e) { for (var n in e) { var i = ("touchstart" === n || "touchmove" === n) && s; t.addEventListener(n, e[n], i) } } function Ui(t, e) { for (var n in e) { var i = 0 <= ["touchstart", "touchmove"].indexOf(n) && s; t.removeEventListener(n, e[n], i) } } function Gi() { return { topics: {}, on: function (t, e) { this.topics[t] = this.topics[t] || [], this.topics[t].push(e) }, off: function (t, e) { if (this.topics[t]) for (var n = 0; n < this.topics[t].length; n++)if (this.topics[t][n] === e) { this.topics[t].splice(n, 1); break } }, emit: function (t, e) { this.topics[t] && this.topics[t].forEach(function (t) { t(e) }) } } } Object.keys || (Object.keys = function (t) { var e = []; for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && e.push(n); return e }), "remove" in Element.prototype || (Element.prototype.remove = function () { this.parentNode && this.parentNode.removeChild(this) }); var Ji = function (h) { h = ki({ container: ".slider", mode: "carousel", axis: "horizontal", items: 1, gutter: 0, edgePadding: 0, fixedWidth: !1, autoWidth: !1, viewportMax: !1, slideBy: 1, controls: !0, controlsText: ["prev", "next"], controlsContainer: !1, prevButton: !1, nextButton: !1, nav: !0, navContainer: !1, navAsThumbnails: !1, arrowKeys: !1, speed: 300, autoplay: !1, autoplayTimeout: 5e3, autoplayDirection: "forward", autoplayText: ["start", "stop"], autoplayHoverPause: !1, autoplayButton: !1, autoplayButtonOutput: !0, autoplayResetOnVisibility: !0, animateIn: "tns-fadeIn", animateOut: "tns-fadeOut", animateNormal: "tns-normal", animateDelay: !1, loop: !0, rewind: !1, autoHeight: !1, responsive: !1, lazyload: !1, touch: !0, mouseDrag: !1, swipeAngle: 15, nested: !1, freezable: !0, onInit: !1, useLocalStorage: !0 }, h || {}); var L = document, p = window, s = 13, u = 32, l = 33, c = 34, f = 35, d = 36, v = 37, m = 38, g = 39, y = 40, e = {}, n = h.useLocalStorage; if (n) { var t = navigator.userAgent, i = new Date; try { (e = p.localStorage) ? (e.setItem(i, i), n = e.getItem(i) == i, e.removeItem(i)) : n = !1, n || (e = {}) } catch (t) { n = !1 } n && (e.tnsApp && e.tnsApp !== t && ["tC", "tPL", "tMQ", "tTf", "t3D", "tTDu", "tTDe", "tADu", "tADe", "tTE", "tAE"].forEach(function (t) { e.removeItem(t) }), localStorage.tnsApp = t) } for (var a, r, o, x, b, w, C, M = e.tC ? Ni(e.tC) : Bi(e, "tC", function () { var t = document, e = Li(), n = Di(e), i = t.createElement("div"), a = !1; e.appendChild(i); try { for (var r, o = "(10px * 10)", s = ["calc" + o, "-moz-calc" + o, "-webkit-calc" + o], u = 0; u < 3; u++)if (r = s[u], i.style.width = r, 100 === i.offsetWidth) { a = r.replace(o, ""); break } } catch (t) { } return e.fake ? Ii(e, n) : i.remove(), a }(), n), A = e.tPL ? Ni(e.tPL) : Bi(e, "tPL", function () { var t, e = document, n = Li(), i = Di(n), a = e.createElement("div"), r = e.createElement("div"), o = ""; a.className = "tns-t-subp2", r.className = "tns-t-ct"; for (var s = 0; s < 70; s++)o += "<div></div>"; return r.innerHTML = o, a.appendChild(r), n.appendChild(a), t = Math.abs(a.getBoundingClientRect().left - r.children[67].getBoundingClientRect().left) < 2, n.fake ? Ii(n, i) : a.remove(), t }(), n), D = e.tMQ ? Ni(e.tMQ) : Bi(e, "tMQ", (r = document, o = Li(), x = Di(o), b = r.createElement("div"), w = r.createElement("style"), C = "@media all and (min-width:1px){.tns-mq-test{position:absolute}}", w.type = "text/css", b.className = "tns-mq-test", o.appendChild(w), o.appendChild(b), w.styleSheet ? w.styleSheet.cssText = C : w.appendChild(r.createTextNode(C)), a = window.getComputedStyle ? window.getComputedStyle(b).position : b.currentStyle.position, o.fake ? Ii(o, x) : b.remove(), "absolute" === a), n), T = e.tTf ? Ni(e.tTf) : Bi(e, "tTf", Xi("transform"), n), E = e.t3D ? Ni(e.t3D) : Bi(e, "t3D", function (t) { if (!t) return !1; if (!window.getComputedStyle) return !1; var e, n = document, i = Li(), a = Di(i), r = n.createElement("p"), o = 9 < t.length ? "-" + t.slice(0, -9).toLowerCase() + "-" : ""; return o += "transform", i.insertBefore(r, null), r.style[t] = "translate3d(1px,1px,1px)", e = window.getComputedStyle(r).getPropertyValue(o), i.fake ? Ii(i, a) : r.remove(), void 0 !== e && 0 < e.length && "none" !== e }(T), n), k = e.tTDu ? Ni(e.tTDu) : Bi(e, "tTDu", Xi("transitionDuration"), n), N = e.tTDe ? Ni(e.tTDe) : Bi(e, "tTDe", Xi("transitionDelay"), n), B = e.tADu ? Ni(e.tADu) : Bi(e, "tADu", Xi("animationDuration"), n), I = e.tADe ? Ni(e.tADe) : Bi(e, "tADe", Xi("animationDelay"), n), O = e.tTE ? Ni(e.tTE) : Bi(e, "tTE", Yi(k, "Transition"), n), S = e.tAE ? Ni(e.tAE) : Bi(e, "tAE", Yi(B, "Animation"), n), H = p.console && "function" == typeof p.console.warn, R = ["container", "controlsContainer", "prevButton", "nextButton", "navContainer", "autoplayButton"], P = {}, W = R.length; W--;) { var z = R[W]; if ("string" == typeof h[z]) { var q = h[z], j = L.querySelector(q); if (P[z] = q, !j || !j.nodeName) return void (H && console.warn("Can't find", h[z])); h[z] = j } } if (!(h.container.children.length < 1)) { var F = h.responsive, Q = h.nested, V = "carousel" === h.mode; if (F) { 0 in F && (h = ki(h, F[0]), delete F[0]); var X = {}; for (var Y in F) { var K = F[Y]; K = "number" == typeof K ? { items: K } : K, X[Y] = K } F = X, X = null } if (V && "outer" !== Q || function t(e) { for (var n in e) V || ("slideBy" === n && (e[n] = "page"), "edgePadding" === n && (e[n] = !1)), "outer" === Q && "autoHeight" === n && (e[n] = !0), "responsive" === n && t(e[n]) }(h), !V) { h.axis = "horizontal", h.slideBy = "page", h.edgePadding = !1; var U = h.animateIn, G = h.animateOut, J = h.animateDelay, _ = h.animateNormal } var Z, $, tt = "horizontal" === h.axis, et = L.createElement("div"), nt = L.createElement("div"), it = h.container, at = it.parentNode, rt = it.outerHTML, ot = it.children, st = ot.length, ut = vn(); F && Ln(); var lt, ct, ft, dt, vt, ht, pt, mt = h.autoWidth, gt = mn("fixedWidth"), yt = mn("edgePadding"), xt = mn("gutter"), bt = hn(), wt = mt ? 1 : Math.floor(mn("items")), Ct = mn("slideBy"), Mt = h.viewportMax || h.fixedWidthViewportWidth, At = mn("arrowKeys"), Tt = mn("speed"), Et = h.rewind, kt = !Et && h.loop, Nt = mn("autoHeight"), Bt = mn("controls"), Lt = mn("controlsText"), Dt = mn("nav"), It = mn("touch"), Ot = mn("mouseDrag"), St = mn("autoplay"), Ht = mn("autoplayTimeout"), Rt = mn("autoplayText"), Pt = mn("autoplayHoverPause"), Wt = mn("autoplayResetOnVisibility"), zt = (pt = document.createElement("style"), ht && pt.setAttribute("media", ht), document.querySelector("head").appendChild(pt), pt.sheet ? pt.sheet : pt.styleSheet), qt = h.lazyload, jt = [], Ft = kt ? (dt = function () { { if (mt || gt && !Mt) return st - 1; var t = gt ? "fixedWidth" : "items", e = []; if ((gt || h[t] < st) && e.push(h[t]), F) for (var n in F) { var i = F[n][t]; i && (gt || i < st) && e.push(i) } return e.length || e.push(0), Math.ceil(gt ? Mt / Math.min.apply(null, e) : Math.max.apply(null, e)) } }(), vt = V ? Math.ceil((5 * dt - st) / 2) : 4 * dt - st, vt = Math.max(dt, vt), pn("edgePadding") ? vt + 1 : vt) : 0, Qt = V ? st + 2 * Ft : st + Ft, Vt = !(!gt && !mt || kt), Xt = gt ? _n() : null, Yt = !V || !kt, Kt = tt ? "left" : "top", Ut = "", Gt = "", Jt = gt ? function () { return Math.floor(-Xt / (gt + xt)) + 1 } : mt ? function () { for (var t = Qt, e = t - 1; t--;)lt[t] > -Xt && (e = t); return e } : function () { return kt || V ? Math.max(0, Qt - Math.ceil(wt)) : Qt - 1 }, _t = fn(mn("startIndex")), Zt = _t, $t = 0, te = mt ? null : Jt(), ee = h.swipeAngle, ne = !ee || "?", ie = !1, ae = h.onInit, re = new Gi, oe = " tns-slider tns-" + h.mode, se = it.id || (ft = window.tnsId, window.tnsId = ft ? ft + 1 : 1, "tns" + window.tnsId), ue = mn("disable"), le = !1, ce = h.freezable, fe = !(!ce || mt) && Bn(), de = !1, ve = { click: oi, keydown: function (t) { switch ((t = hi(t)).keyCode) { case v: case m: case l: Oe.disabled || oi(t, -1); break; case g: case y: case c: Se.disabled || oi(t, 1); break; case d: ri("first", t); break; case f: ri("last", t) } } }, he = { click: function (t) { ie && ai(); var e = (t = hi(t)).target || t.srcElement; for (; e !== We && !zi(e, "data-nav");)e = e.parentNode; zi(e, "data-nav") && ri(Fe = [].indexOf.call(Pe, e), t) }, keydown: function (t) { var e = L.activeElement; if (!zi(e, "data-nav")) return; var n = (t = hi(t)).keyCode, i = [].indexOf.call(Pe, e), a = qe.length, r = qe.indexOf(i); h.navContainer && (a = st, r = i); function o(t) { return h.navContainer ? t : qe[t] } switch (n) { case v: case l: 0 < r && vi(Pe[o(r - 1)]); break; case m: case d: 0 < r && vi(Pe[o(0)]); break; case g: case c: r < a - 1 && vi(Pe[o(r + 1)]); break; case y: case f: r < a - 1 && vi(Pe[o(a - 1)]); break; case s: case u: ri(Fe = i, t) } } }, pe = { mouseover: function () { Ke && (ui(), Ue = !0) }, mouseout: function () { Ue && (si(), Ue = !1) } }, me = { visibilitychange: function () { L.hidden ? Ke && (ui(), Je = !0) : Je && (si(), Je = !1) } }, ge = { keydown: function (t) { switch ((t = hi(t)).keyCode) { case v: oi(t, -1); break; case g: oi(t, 1) } } }, ye = { touchstart: yi, touchmove: xi, touchend: wi, touchcancel: wi }, xe = { mousedown: yi, mousemove: xi, mouseup: wi, mouseleave: wi }, be = pn("controls"), we = pn("nav"), Ce = !!mt || h.navAsThumbnails, Me = pn("autoplay"), Ae = pn("touch"), Te = pn("mouseDrag"), Ee = "tns-slide-active", ke = "tns-complete", Ne = { load: Rn, error: Rn }; if (be) var Be, Le, De = h.controlsContainer, Ie = h.controlsContainer ? h.controlsContainer.outerHTML : "", Oe = h.prevButton, Se = h.nextButton, He = h.prevButton ? h.prevButton.outerHTML : "", Re = h.nextButton ? h.nextButton.outerHTML : ""; if (we) var Pe, We = h.navContainer, ze = h.navContainer ? h.navContainer.outerHTML : "", qe = [], je = qe, Fe = -1, Qe = dn(), Ve = Qe, Xe = "tns-nav-active"; if (Me) var Ye, Ke, Ue, Ge, Je, _e = "forward" === h.autoplayDirection ? 1 : -1, Ze = h.autoplayButton, $e = h.autoplayButton ? h.autoplayButton.outerHTML : "", tn = ["<span class='tns-visually-hidden'>", " animation</span>"]; if (Ae || Te) var en, nn = {}, an = {}, rn = !1, on = 0, sn = tt ? function (t, e) { return t.x - e.x } : function (t, e) { return t.y - e.y }; mt || cn(ue || fe), T && (Kt = T, Ut = "translate", E ? (Ut += tt ? "3d(" : "3d(0px, ", Gt = tt ? ", 0px, 0px)" : ", 0px)") : (Ut += tt ? "X(" : "Y(", Gt = ")")), function () { F && Ln(); !function () { pn("gutter"); et.className = "tns-outer", nt.className = "tns-inner", et.id = se + "-ow", nt.id = se + "-iw", Nt && (nt.className += " tns-ah"); "" === it.id && (it.id = se); oe += A || mt ? " tns-subpixel" : " tns-no-subpixel", oe += M ? " tns-calc" : " tns-no-calc", V && (oe += " tns-" + h.axis); if (it.className += oe, V) { var t = L.createElement("div"); t.className = "tns-ovh", et.appendChild(t), t.appendChild(nt) } else et.appendChild(nt); at.insertBefore(et, it), nt.appendChild(it) }(); for (var t = 0; t < st; t++) { var e = ot[t]; e.id || (e.id = se + "-item" + t), Pi(e, "tns-item"), !V && _ && Pi(e, _), qi(e, { "aria-hidden": "true", tabindex: "-1" }) } if (Ft) { for (var n = L.createDocumentFragment(), i = L.createDocumentFragment(), a = Ft; a--;) { var r = a % st, o = ot[r].cloneNode(!0); if (ji(o, "id"), i.insertBefore(o, i.firstChild), V) { var s = ot[st - 1 - r].cloneNode(!0); ji(s, "id"), n.appendChild(s) } } it.insertBefore(n, it.firstChild), it.appendChild(i), ot = it.children } (function () { for (var t = _t, e = _t + Math.min(st, wt); t < e; t++) { var n = ot[t]; qi(n, { "aria-hidden": "false" }), ji(n, ["tabindex"]), Pi(n, Ee), V || (n.style.left = 100 * (t - _t) / wt + "%", Pi(n, U), Wi(n, _)) } if (V && tt && (A || mt ? (Oi(zt, "#" + se + " > .tns-item", "font-size:" + p.getComputedStyle(ot[0]).fontSize + ";", Si(zt)), Oi(zt, "#" + se, "font-size:0;", Si(zt))) : Hi(ot, function (t, e) { var n; t.style.marginLeft = (n = e, M ? M + "(" + 100 * n + "% / " + Qt + ")" : 100 * n / Qt + "%") })), D) { var i = gn(h.edgePadding, h.gutter, h.fixedWidth, h.speed); Oi(zt, "#" + se + "-iw", i, Si(zt)), V && (i = tt && !mt ? "width:" + yn(h.fixedWidth, h.gutter, h.items) + ";" : "", k && (i += Cn(Tt)), Oi(zt, "#" + se, i, Si(zt))), i = tt && !mt ? xn(h.fixedWidth, h.gutter, h.items) : "", h.gutter && (i += bn(h.gutter)), V || (k && (i += Cn(Tt)), B && (i += Mn(Tt))), i && Oi(zt, "#" + se + " > .tns-item", i, Si(zt)) } else { nt.style.cssText = gn(yt, xt, gt), V && tt && !mt && (it.style.width = yn(gt, xt, wt)); var i = tt && !mt ? xn(gt, xt, wt) : ""; xt && (i += bn(xt)), i && Oi(zt, "#" + se + " > .tns-item", i, Si(zt)) } if (F && D) for (var a in F) { a = parseInt(a); var r = F[a], i = "", o = "", s = "", u = "", l = mt ? null : mn("items", a), c = mn("fixedWidth", a), f = mn("speed", a), d = mn("edgePadding", a), v = mn("gutter", a); ("edgePadding" in r || "gutter" in r) && (o = "#" + se + "-iw{" + gn(d, v, c, f) + "}"), V && tt && !mt && ("fixedWidth" in r || "items" in r || gt && "gutter" in r) && (s = "width:" + yn(c, v, l) + ";"), k && "speed" in r && (s += Cn(f)), s && (s = "#" + se + "{" + s + "}"), ("fixedWidth" in r || gt && "gutter" in r || !V && "items" in r) && (u += xn(c, v, l)), "gutter" in r && (u += bn(v)), !V && "speed" in r && (k && (u += Cn(f)), B && (u += Mn(f))), u && (u = "#" + se + " > .tns-item{" + u + "}"), (i = o + s + u) && zt.insertRule("@media (min-width: " + a / 16 + "em) {" + i + "}", zt.cssRules.length) } })(), An(), mt || (Tn(), En()) }(); var un = kt ? V ? function () { var t = $t, e = te; t += Ct, e -= Ct, yt ? (t += 1, e -= 1) : gt && bt % (gt + xt) && (e -= 1), Ft && (e < _t ? _t -= st : _t < t && (_t += st)) } : function () { if (te < _t) for (; $t + st <= _t;)_t -= st; else if (_t < $t) for (; _t <= te - st;)_t += st } : function () { _t = Math.max($t, Math.min(te, _t)) }, ln = V ? function () { var e, n, i, a, t, r, o, s, u, l, c; Gn(it, ""), k || !Tt ? (ti(), Tt && Vi(it) || ai()) : (e = it, n = Kt, i = Ut, a = Gt, t = Zn(), r = Tt, o = ai, s = Math.min(r, 10), u = 0 <= t.indexOf("%") ? "%" : "px", t = t.replace(u, ""), l = Number(e.style[n].replace(i, "").replace(a, "").replace(u, "")), c = (t - l) / r * s, setTimeout(function t() { r -= s, l += c, e.style[n] = i + l + u + a, 0 < r ? setTimeout(t, s) : o() }, s)), tt || Ci() } : function () { jt = []; var t = {}; t[O] = t[S] = ai, Ui(ot[Zt], t), Ki(ot[_t], t), ei(Zt, U, G, !0), ei(_t, _, U), O && S && Tt && Vi(it) || ai() }; return { version: "2.8.5", getInfo: Ai, events: re, goTo: ri, play: function () { St && !Ke && (ci(), Ge = !1) }, pause: function () { Ke && (fi(), Ge = !0) }, isOn: $, updateSliderHeight: Fn, refresh: An, destroy: function () { if (zt.disabled = !0, zt.ownerNode && zt.ownerNode.remove(), Ui(p, { resize: kn }), At && Ui(L, ge), De && Ui(De, ve), We && Ui(We, he), Ui(it, pe), Ui(it, me), Ze && Ui(Ze, { click: di }), St && clearInterval(Ye), V && O) { var t = {}; t[O] = ai, Ui(it, t) } It && Ui(it, ye), Ot && Ui(it, xe); var a = [rt, Ie, He, Re, ze, $e]; R.forEach(function (t, e) { var n = "container" === t ? et : h[t]; if ("object" == typeof n) { var i = !!n.previousElementSibling && n.previousElementSibling; n.outerHTML = a[e], h[t] = i ? i.nextElementSibling : n.parentNode.firstElementChild } }), R = U = G = J = _ = tt = et = nt = it = at = rt = ot = st = Z = ut = mt = gt = yt = xt = bt = wt = Ct = Mt = At = Tt = Et = kt = Nt = zt = qt = lt = jt = Ft = Qt = Vt = Xt = Yt = Kt = Ut = Gt = Jt = _t = Zt = $t = te = ee = ne = ie = ae = re = oe = se = ue = le = ce = fe = de = ve = he = pe = me = ge = ye = xe = be = we = Ce = Me = Ae = Te = Ee = ke = Ne = ct = Bt = Lt = De = Ie = Oe = Se = Be = Le = Dt = We = ze = Pe = qe = je = Fe = Qe = Ve = Xe = St = Ht = _e = Rt = Pt = Ze = $e = Wt = tn = Ye = Ke = Ue = Ge = Je = nn = an = en = rn = on = sn = It = Ot = null, this.getInfo = this.events = this.goTo = this.play = this.pause = this.destroy = null, this.isOn = $ = !1 }, rebuild: function () { return Ji(ki(h, P)) } } } function cn(t) { t && (Bt = Dt = It = Ot = At = St = Pt = Wt = !1) } function fn(t) { return t = t ? Math.max(0, Math.min(kt ? st - 1 : st - wt, t)) : 0, V ? t + Ft : t } function dn(t) { for (null == t && (t = _t), V && (t -= Ft); t < 0;)t += st; return Math.floor(t % st) } function vn() { return p.innerWidth || L.documentElement.clientWidth || L.body.clientWidth } function hn() { return function t(e) { return e.clientWidth || t(e.parentNode) }(at) - (2 * yt - xt) } function pn(t) { if (h[t]) return !0; if (F) for (var e in F) if (F[e][t]) return !0; return !1 } function mn(t, e) { if (null == e && (e = ut), "items" === t && gt) return Math.floor(bt / (gt + xt)) || 1; var n = h[t]; if (F) for (var i in F) e >= parseInt(i) && t in F[i] && (n = F[i][t]); return "slideBy" === t && "page" === n && (n = mn("items")), V || "slideBy" !== t && "items" !== t || (n = Math.floor(n)), n } function gn(t, e, n, i) { var a = ""; if (t) { var r = t; e && (r -= e), a = tt ? "margin: 0 " + r + "px 0 " + t + "px;" : "margin: " + t + "px 0 " + r + "px 0;" } else if (e && !n) { var o = "-" + e + "px"; a = "margin: 0 " + (tt ? o + " 0 0" : "0 " + o + " 0") + ";" } return k && i && (a += Cn(i)), a } function yn(t, e, n) { return t ? (t + e) * Qt + "px" : M ? M + "(" + 100 * Qt + "% / " + n + ")" : 100 * Qt / n + "%" } function xn(t, e, n) { var i; if (t) i = t + e + "px"; else { V || (n = Math.floor(n)); var a = V ? Qt : n; i = M ? M + "(100% / " + a + ")" : 100 / a + "%" } return i = "width:" + i, "inner" !== Q ? i + ";" : i + " !important;" } function bn(t) { var e = ""; !1 !== t && (e = (tt ? "padding-" : "margin-") + (tt ? "right" : "bottom") + ": " + t + "px;"); return e } function wn(t, e) { var n = t.substring(0, t.length - e).toLowerCase(); return n && (n = "-" + n + "-"), n } function Cn(t) { return wn(k, 18) + "transition-duration:" + t / 1e3 + "s;" } function Mn(t) { return wn(B, 17) + "animation-duration:" + t / 1e3 + "s;" } function An() { if (pn("autoHeight") || mt || !tt) { var t = it.querySelectorAll("img"); Hi(t, function (t) { var e = t.src; e.indexOf("data:image") < 0 ? (Ki(t, Ne), t.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", t.src = e) : Pi(t, ke) }), Ti(function () { zn(function (t) { for (var e = [], n = 0, i = t.length; n < i; n++)e.push(t[n]); return e }(t), function () { if (ct = !0, mt) { var e = kt ? _t : st - 1; !function t() { ot[e - 1].getBoundingClientRect().right.toFixed(2) === ot[e].getBoundingClientRect().left.toFixed(2) ? n() : setTimeout(function () { t() }, 16) }() } else n(); function n() { tt && !mt || (Qn(), mt ? (Xt = _n(), ce && (fe = Bn()), te = Jt(), cn(ue || fe)) : Ci()), V && $n(), Tn(), En() } }) }) } else V && $n() } function Tn() { if (Me) { var t = St ? "stop" : "start"; Ze ? qi(Ze, { "data-action": t }) : h.autoplayButtonOutput && (et.insertAdjacentHTML("afterbegin", '<button data-action="' + t + '" type="button">' + tn[0] + t + tn[1] + Rt[0] + "</button>"), Ze = et.querySelector("[data-action]")), Ze && Ki(Ze, { click: di }), St && (ci(), Pt && Ki(it, pe), Wt && Ki(it, me)) } if (we) { var e = V ? Ft : 0; if (We) { qi(We, { "aria-label": "Carousel Pagination" }), Pe = We.children; for (var n = 0; n < st; n++) { var i = Pe[n]; i && qi(i, { "data-nav": n, tabindex: "-1", "aria-selected": "false", "aria-controls": ot[e + n].id }) } } else { var a = "", r = Ce ? "" : "hidden"; for (n = 0; n < st; n++)a += '<button data-nav="' + n + '" tabindex="-1" aria-selected="false" aria-controls="' + ot[e + n].id + '" ' + r + ' type="button"></button>'; a = '<div class="tns-nav" aria-label="Carousel Pagination">' + a + "</div>", et.insertAdjacentHTML("afterbegin", a), We = et.querySelector(".tns-nav"), Pe = We.children } if (Mi(), k) { var o = k.substring(0, k.length - 18).toLowerCase(), s = "transition: all " + Tt / 1e3 + "s"; o && (s = "-" + o + "-" + s), Oi(zt, "[aria-controls^=" + se + "-item]", s, Si(zt)) } qi(Pe[Qe], { tabindex: "0", "aria-selected": "true" }), Pi(Pe[Qe], Xe), Ki(We, he) } be && (De || Oe && Se ? (De && (Oe = De.children[0], Se = De.children[1], qi(De, { "aria-label": "Carousel Navigation", tabindex: "0" }), qi(De.children, { "aria-controls": se, tabindex: "-1" })), qi(Oe, { "data-controls": "prev" }), qi(Se, { "data-controls": "next" })) : (et.insertAdjacentHTML("afterbegin", '<div class="tns-controls" aria-label="Carousel Navigation" tabindex="0"><button data-controls="prev" tabindex="-1" aria-controls="' + se + '" type="button">' + Lt[0] + '</button><button data-controls="next" tabindex="-1" aria-controls="' + se + '" type="button">' + Lt[1] + "</button></div>"), De = et.querySelector(".tns-controls"), Oe = De.children[0], Se = De.children[1]), Be = Xn(Oe), Le = Xn(Se), Un(), De ? Ki(De, ve) : (Ki(Oe, ve), Ki(Se, ve))), Dn() } function En() { if (V && O) { var t = {}; t[O] = ai, Ki(it, t) } It && Ki(it, ye), Ot && Ki(it, xe), At && Ki(L, ge), "inner" === Q ? re.on("outerResized", function () { Nn(), re.emit("innerLoaded", Ai()) }) : (F || gt || mt || !tt) && Ki(p, { resize: kn }), "outer" === Q ? re.on("innerLoaded", Wn) : !Nt && V || ue || Wn(), Hn(), ue ? Sn() : fe && On(), re.on("indexChanged", qn), "function" == typeof ae && ae(Ai()), "inner" === Q && re.emit("innerLoaded", Ai()), $ = !0 } function kn(t) { Ti(function () { Nn(hi(t)) }) } function Nn(t) { if ($) { "outer" === Q && re.emit("outerResized", Ai(t)), ut = vn(); var e, n = Z, i = !1; F && (Ln(), (e = n !== Z) && re.emit("newBreakpointStart", Ai(t))); var a, r, o, s, u = wt, l = ue, c = fe, f = At, d = Bt, v = Dt, h = It, p = Ot, m = St, g = Pt, y = Wt, x = _t; if (e) { var b = gt, w = Nt, C = Lt, M = Rt; if (!D) var A = xt, T = yt } if (At = mn("arrowKeys"), Bt = mn("controls"), Dt = mn("nav"), It = mn("touch"), Ot = mn("mouseDrag"), St = mn("autoplay"), Pt = mn("autoplayHoverPause"), Wt = mn("autoplayResetOnVisibility"), e && (ue = mn("disable"), gt = mn("fixedWidth"), Tt = mn("speed"), Nt = mn("autoHeight"), Lt = mn("controlsText"), Rt = mn("autoplayText"), Ht = mn("autoplayTimeout"), D || (yt = mn("edgePadding"), xt = mn("gutter"))), cn(ue), bt = hn(), tt && !mt || ue || (Qn(), tt || (Ci(), i = !0)), (gt || mt) && (Xt = _n(), te = Jt()), (e || gt) && (wt = mn("items"), Ct = mn("slideBy"), (r = wt !== u) && (gt || mt || (te = Jt()), un())), e && ue !== l && (ue ? Sn() : function () { if (!le) return; if (zt.disabled = !1, it.className += oe, $n(), kt) for (var t = Ft; t--;)V && Qi(ot[t]), Qi(ot[Qt - t - 1]); if (!V) for (var e = _t, n = _t + st; e < n; e++) { var i = ot[e], a = e < _t + wt ? U : _; i.style.left = 100 * (e - _t) / wt + "%", Pi(i, a) } In(), le = !1 }()), ce && (e || gt || mt) && (fe = Bn()) !== c && (fe ? (ti(Zn(fn(0))), On()) : (!function () { if (!de) return; yt && D && (nt.style.margin = ""); if (Ft) for (var t = "tns-transparent", e = Ft; e--;)V && Wi(ot[e], t), Wi(ot[Qt - e - 1], t); In(), de = !1 }(), i = !0)), cn(ue || fe), St || (Pt = Wt = !1), At !== f && (At ? Ki(L, ge) : Ui(L, ge)), Bt !== d && (Bt ? Qi(De) : Fi(De)), Dt !== v && (Dt ? (Qi(We), Mi()) : Fi(We)), It !== h && (It ? Ki(it, ye) : Ui(it, ye)), Ot !== p && (Ot ? Ki(it, xe) : Ui(it, xe)), St !== m && (St ? (Ze && Qi(Ze), Ke || Ge || ci()) : (Ze && Fi(Ze), Ke && fi())), Pt !== g && (Pt ? Ki(it, pe) : Ui(it, pe)), Wt !== y && (Wt ? Ki(L, me) : Ui(L, me)), e && (gt !== b && (i = !0), Nt !== w && (Nt || (nt.style.height = "")), Bt && Lt !== C && (Oe.innerHTML = Lt[0], Se.innerHTML = Lt[1]), Ze && Rt !== M)) { var E = St ? 1 : 0, k = Ze.innerHTML, N = k.length - M[E].length; k.substring(N) === M[E] && (Ze.innerHTML = k.substring(0, N) + Rt[E]) } if ((a = _t !== x) && (re.emit("indexChanged", Ai()), i = !0), r && (a || qn(), V || function () { for (var t = _t + Math.min(st, wt), e = Qt; e--;) { var n = ot[e]; _t <= e && e < t ? (Pi(n, "tns-moving"), n.style.left = 100 * (e - _t) / wt + "%", Pi(n, U), Wi(n, _)) : n.style.left && (n.style.left = "", Pi(n, _), Wi(n, U)), Wi(n, G) } setTimeout(function () { Hi(ot, function (t) { Wi(t, "tns-moving") }) }, 300) }()), !ue && !fe) { if (e && !D && (yt === T && xt === A || (nt.style.cssText = gn(yt, xt, gt)), tt)) { V && (it.style.width = yn(gt, xt, wt)); var B = xn(gt, xt, wt) + bn(xt); s = Si(o = zt) - 1, "deleteRule" in o ? o.deleteRule(s) : o.removeRule(s), Oi(zt, "#" + se + " > .tns-item", B, Si(zt)) } !Nt && V || Wn(), i && ($n(), Zt = _t) } e && re.emit("newBreakpointEnd", Ai(t)) } } function Bn() { return gt || mt ? gt ? (gt + xt) * st <= bt + 2 * yt : (kt ? lt[st] : Jn()) <= bt + 2 * yt : st <= wt } function Ln() { for (var t in Z = 0, F) (t = parseInt(t)) <= ut && (Z = t) } function Dn() { !St && Ze && Fi(Ze), !Dt && We && Fi(We), !Bt && De && Fi(De) } function In() { St && Ze && Qi(Ze), Dt && We && Qi(We), Bt && De && Qi(De) } function On() { if (!de) { if (yt && (nt.style.margin = "0px"), Ft) for (var t = "tns-transparent", e = Ft; e--;)V && Pi(ot[e], t), Pi(ot[Qt - e - 1], t); Dn(), de = !0 } } function Sn() { if (!le) { if (zt.disabled = !0, it.className = it.className.replace(oe.substring(1), ""), ji(it, ["style"]), kt) for (var t = Ft; t--;)V && Fi(ot[t]), Fi(ot[Qt - t - 1]); if (tt && V || ji(nt, ["style"]), !V) for (var e = _t, n = _t + st; e < n; e++) { var i = ot[e]; ji(i, ["style"]), Wi(i, U), Wi(i, _) } Dn(), le = !0 } } function Hn() { if (qt && !ue) { var t = _t; if (mt) for (var e = _t + 1, n = e, i = lt[_t] + bt + yt - xt; lt[e] < i;)n = ++e; else n = _t + wt; for (yt && (t -= 1, mt || (n += 1)), t = Math.floor(Math.max(t, 0)), n = Math.ceil(Math.min(n, Qt)); t < n; t++)Hi(ot[t].querySelectorAll(".tns-lazy-img"), function (t) { var e, n = {}; n[O] = function (t) { t.stopPropagation() }, Ki(t, n), Ri(t, "loaded") || (t.src = (e = "data-src", t.getAttribute(e)), Pi(t, "loaded")) }) } } function Rn(t) { var e = pi(t); Pi(e, ke), Ui(e, Ne) } function Pn(t, e) { for (var n = [], i = t, a = Math.min(t + e, Qt); i < a; i++)Hi(ot[i].querySelectorAll("img"), function (t) { n.push(t) }); return n } function Wn() { var t = Nt ? Pn(_t, wt) : Pn(Ft, st); Ti(function () { zn(t, Fn) }) } function zn(n, t) { return ct ? t() : (n.forEach(function (t, e) { Ri(t, ke) && n.splice(e, 1) }), n.length ? void Ti(function () { zn(n, t) }) : t()) } function qn() { Hn(), function () { for (var t = _t + Math.min(st, wt), e = Qt; e--;) { var n = ot[e]; _t <= e && e < t ? zi(n, "tabindex") && (qi(n, { "aria-hidden": "false" }), ji(n, ["tabindex"]), Pi(n, Ee)) : (zi(n, "tabindex") || qi(n, { "aria-hidden": "true", tabindex: "-1" }), Ri(n, Ee) && Wi(n, Ee)) } }(), Un(), Mi(), function () { if (Dt && (Qe = -1 !== Fe ? Fe : dn(), Fe = -1, Qe !== Ve)) { var t = Pe[Ve], e = Pe[Qe]; qi(t, { tabindex: "-1", "aria-selected": "false" }), qi(e, { tabindex: "0", "aria-selected": "true" }), Wi(t, Xe), Pi(e, Xe), Ve = Qe } }() } function jn(t, e) { for (var n = [], i = t, a = Math.min(t + e, Qt); i < a; i++)n.push(ot[i].offsetHeight); return Math.max.apply(null, n) } function Fn() { var t = Nt ? jn(_t, wt) : jn(Ft, st); nt.style.height !== t && (nt.style.height = t + "px") } function Qn() { lt = [0]; for (var t, e = tt ? "left" : "top", n = ot[0].getBoundingClientRect()[e], i = 1; i < Qt; i++)t = ot[i].getBoundingClientRect()[e], lt.push(t - n) } function Vn(t) { return t.nodeName.toLowerCase() } function Xn(t) { return "button" === Vn(t) } function Yn(t) { return "true" === t.getAttribute("aria-disabled") } function Kn(t, e, n) { t ? e.disabled = n : e.setAttribute("aria-disabled", n.toString()) } function Un() { if (Bt && !Et && !kt) { var t = Be ? Oe.disabled : Yn(Oe), e = Le ? Se.disabled : Yn(Se), n = _t <= $t, i = !Et && te <= _t; n && !t && Kn(Be, Oe, !0), !n && t && Kn(Be, Oe, !1), i && !e && Kn(Le, Se, !0), !i && e && Kn(Le, Se, !1) } } function Gn(t, e) { k && (t.style[k] = e) } function Jn() { return gt ? (gt + xt) * Qt : lt[Qt - 1] + ot[Qt - 1].getBoundingClientRect().width } function _n() { var t = bt - (Jn() - xt); return yt && (t += yt - xt), 0 < t && (t = 0), t } function Zn(t) { var e; (null == t && (t = _t), tt && !mt) ? e = gt ? -(gt + xt) * t : 100 * -t / (T ? Qt : wt) : e = -lt[t]; return Vt && (e = Math.max(e, Xt)), e += !tt || mt || gt ? "px" : "%" } function $n(t) { Gn(it, "0s"), ti(t) } function ti(t) { null == t && (t = Zn()), it.style[Kt] = Ut + t + Gt } function ei(t, e, n, i) { var a = t + wt; kt || (a = Math.min(a, Qt)); for (var r = t; r < a; r++) { var o = ot[r]; i || (o.style.left = 100 * (r - _t) / wt + "%"), J && N && (o.style[N] = o.style[I] = J * (r - t) / 1e3 + "s"), Wi(o, e), Pi(o, n), i && jt.push(o) } } function ni(t, e) { Yt && un(), (_t !== Zt || e) && (re.emit("indexChanged", Ai()), re.emit("transitionStart", Ai()), Nt && Wn(), Ke && t && 0 <= ["click", "keydown"].indexOf(t.type) && fi(), ie = !0, ln()) } function ii(t) { return t.toLowerCase().replace(/-/g, "") } function ai(t) { if (V || ie) { if (re.emit("transitionEnd", Ai(t)), !V && 0 < jt.length) for (var e = 0; e < jt.length; e++) { var n = jt[e]; n.style.left = "", I && N && (n.style[I] = "", n.style[N] = ""), Wi(n, G), Pi(n, _) } if (!t || !V && t.target.parentNode === it || t.target === it && ii(t.propertyName) === ii(Kt)) { if (!Yt) { var i = _t; un(), _t !== i && (re.emit("indexChanged", Ai()), $n()) } "inner" === Q && re.emit("innerLoaded", Ai()), ie = !1, Zt = _t } } } function ri(t, e) { if (!fe) if ("prev" === t) oi(e, -1); else if ("next" === t) oi(e, 1); else { ie && ai(); var n = dn(), i = 0; if ("first" === t ? i = -n : "last" === t ? i = V ? st - wt - n : st - 1 - n : ("number" != typeof t && (t = parseInt(t)), isNaN(t) || (e || (t = Math.max(0, Math.min(st - 1, t))), i = t - n)), !V && i && Math.abs(i) < wt) { var a = 0 < i ? 1 : -1; i += $t <= _t + i - st ? st * a : 2 * st * a * -1 } _t += i, V && kt && (_t < $t && (_t += st), te < _t && (_t -= st)), dn(_t) !== dn(Zt) && ni(e) } } function oi(t, e) { var n; if (ie && ai(), !e) { for (var i = (t = hi(t)).target || t.srcElement; i !== De && [Oe, Se].indexOf(i) < 0;)i = i.parentNode; var a = [Oe, Se].indexOf(i); 0 <= a && (n = !0, e = 0 === a ? -1 : 1) } if (Et) { if (_t === $t && -1 === e) return void ri("last", t); if (_t === te && 1 === e) return void ri("first", t) } e && (_t += Ct * e, mt && (_t = Math.floor(_t)), ni(n || t && "keydown" === t.type ? t : null)) } function si() { Ye = setInterval(function () { oi(null, _e) }, Ht), Ke = !0 } function ui() { clearInterval(Ye), Ke = !1 } function li(t, e) { qi(Ze, { "data-action": t }), Ze.innerHTML = tn[0] + t + tn[1] + e } function ci() { si(), Ze && li("stop", Rt[1]) } function fi() { ui(), Ze && li("start", Rt[0]) } function di() { Ke ? (fi(), Ge = !0) : (ci(), Ge = !1) } function vi(t) { t.focus() } function hi(t) { return mi(t = t || p.event) ? t.changedTouches[0] : t } function pi(t) { return t.target || p.event.srcElement } function mi(t) { return 0 <= t.type.indexOf("touch") } function gi(t) { t.preventDefault ? t.preventDefault() : t.returnValue = !1 } function yi(t) { ie && ai(), rn = !0, V && (Ei(on), on = 0); var e = hi(t); re.emit(mi(t) ? "touchStart" : "dragStart", Ai(t)), !mi(t) && 0 <= ["img", "a"].indexOf(Vn(pi(t))) && gi(t), an.x = nn.x = parseInt(e.clientX), an.y = nn.y = parseInt(e.clientY), V && (en = parseFloat(it.style[Kt].replace(Ut, "").replace(Gt, "")), Gn(it, "0s")) } function xi(t) { if (rn) { var e = hi(t); an.x = parseInt(e.clientX), an.y = parseInt(e.clientY), V && !on && (on = Ti(function () { !function t(e) { if (!ne) return void (rn = !1); Ei(on); rn && (on = Ti(function () { t(e) })); bi(); if (ne) { try { e.type && re.emit(mi(e) ? "touchMove" : "dragMove", Ai(e)) } catch (t) { } var n = en, i = sn(an, nn); if (!tt || gt || mt) n += i, n += "px"; else { var a = T ? i * wt * 100 / (bt * Qt) : 100 * i / bt; n += a, n += "%" } it.style[Kt] = Ut + n + Gt } }(t) })) } } function bi() { var t, e, n, i, a, r; "?" === ne && an.x !== nn.x && an.y !== nn.y && (a = an.y - nn.y, r = an.x - nn.x, t = Math.atan2(a, r) * (180 / Math.PI), e = ee, n = !1, i = Math.abs(90 - Math.abs(t)), 90 - e <= i ? n = "horizontal" : i <= e && (n = "vertical"), ne = n === h.axis) } function wi(i) { if (rn) { V && (Ei(on), Gn(it, "")), rn = !1; var t = hi(i); an.x = parseInt(t.clientX), an.y = parseInt(t.clientY); var a = sn(an, nn); if (5 <= Math.abs(a)) { if (!mi(i)) { var n = pi(i); Ki(n, { click: function t(e) { gi(e), Ui(n, { click: t }) } }) } V ? on = Ti(function () { if (tt && !mt) { var t = -a * wt / bt; t = 0 < a ? Math.floor(t) : Math.ceil(t), _t += t } else { var e = -(en + a); if (e <= 0) _t = $t; else if (e >= lt[lt.length - 1]) _t = te; else for (var n = 0; n < Qt && e >= lt[n];)e > lt[_t = n] && a < 0 && (_t += 1), n++ } ni(i, a), re.emit(mi(i) ? "touchEnd" : "dragEnd", Ai(i)) }) : (bi(), ne && oi(i, 0 < a ? -1 : 1)) } } ee && (ne = "?") } function Ci() { nt.style.height = lt[_t + wt] - lt[_t] + "px" } function Mi() { Dt && !Ce && (!function () { qe = []; for (var t = dn() % wt; t < st;)V && !kt && st < t + wt && (t = st - wt), qe.push(t), t += wt; (kt && qe.length * wt < st || !kt && 0 < qe[0]) && qe.unshift(0) }(), qe !== je && (Hi(Pe, function (t, e) { qe.indexOf(e) < 0 ? Fi(t) : Qi(t) }), je = qe)) } function Ai(t) { return { container: it, slideItems: ot, navContainer: We, navItems: Pe, controlsContainer: De, hasControls: be, prevButton: Oe, nextButton: Se, items: wt, slideBy: Ct, cloneCount: Ft, slideCount: st, slideCountNew: Qt, index: _t, indexCached: Zt, navCurrentIndex: Qe, navCurrentIndexCached: Ve, visibleNavIndexes: qe, visibleNavIndexesCached: je, sheet: zt, event: t || {} } } H && console.warn("No slides found in", h.container) }; return Ji }();

(function ($K) 
{
    $K.add('module', 'tns', {
        init: function (app, context) {
            this.app = app;

            this.context = context;
            this.params = context.getParams();
            this.$element = context.getElement();
            this.$target = context.getTarget();

            var defaults = {
                container: this.$element.get(),
                items: 1,
                controls: true,
                controlsContainer: null,
                navContainer: null,
                nav: false,
                speed: 500,
                autoplay: true,
                loop: false,
                arrowKeys: true,
                autoplayButtonOutput: false,
                axis: 'horizontal'
            };

            var $tnsControls = $K.dom(this.params.controlsContainer);
            var $tnsSlider = $K.dom(this.$element.get());
            $tnsSlider.wrap('<div class="tns-slider-wrapper" style="position: relative;">');
            $tnsSlider.before($tnsControls);

            this.params = context.getParams(defaults);
            this.tns = null;
        },
        start: function () {
            // build
            this._build();
        },
        ontns: {
            next: function (module, $element, args) {
                this.tns.goTo(args.id);
            }
        },
        _build: function () {
            this.tns = tns(this.params);
        }
    });
})(Kube);