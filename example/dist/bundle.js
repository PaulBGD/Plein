(function () {
'use strict';

var pointSize = /* 1 / */ 72.27; // point size compared to inch
var pixelSize = /* 1 / */ 96; // pixel size compared to inch

function pointToPixel(pt) {
    return (pt / pointSize) * pixelSize;
}

var Content = function Content(parent) {
    console.log('setting', parent);
    this.parent = parent;
    this.children = [];

    this.supportsMultiLine = false;

    this.styles = {
        fontSize: pointToPixel(12)
    };
};

Content.prototype.getHeight = function getHeight () {
    throw new Error('Height not implemented!');
};

Content.prototype.create = function create (node) {
    this.node = node;
};

Content.prototype.handle = function handle (event, target, data) {
    console.error('Unhandled event', event, target, data, this);
};

Content.prototype.setPointSize = function setPointSize (pt) {
    this.styles.fontSize = pointToPixel(pt);
    this.updateCSS();
};

Content.prototype.clone = function clone () {
    console.error('Clone not implemented.');
};

Content.prototype.updateCSS = function updateCSS () {
    console.error('Update CSS not implemented.');
};

function toString(object) {
    var out = {};
    for (var property in object) {
        if (object.hasOwnProperty(property)) {
            out[property.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase()] = object[property];
        }
    }
    return Object.keys(out)
        .filter(function (key) { return convertValue(out[key]); })
        .map(function (key) { return (key + ": " + (convertValue(out[key]))); }).join('; ');
}

function convertValue(value) {
    if (!value) {
        return null;
    }
    if (typeof value !== 'string') {
        value = value + 'px';
    }
    return value;
}

function appendNode ( node, target ) {
	target.appendChild( node );
}

function insertNode ( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function detachNode ( node ) {
	node.parentNode.removeChild( node );
}

function createElement ( name ) {
	return document.createElement( name );
}

function createText ( data ) {
	return document.createTextNode( data );
}

function addEventListener ( node, event, handler ) {
	node.addEventListener ( event, handler, false );
}

function removeEventListener ( node, event, handler ) {
	node.removeEventListener ( event, handler, false );
}

function setAttribute ( node, attribute, value ) {
	node.setAttribute ( attribute, value );
}

function get ( key ) {
	return key ? this._state[ key ] : this._state;
}

function fire ( eventName, data ) {
	var this$1 = this;

	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
	if ( !handlers ) { return; }

	for ( var i = 0; i < handlers.length; i += 1 ) {
		handlers[i].call( this$1, data );
	}
}

function observe ( key, callback, options ) {
	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;

	( group[ key ] || ( group[ key ] = [] ) ).push( callback );

	if ( !options || options.init !== false ) {
		callback.__calling = true;
		callback.call( this, this._state[ key ] );
		callback.__calling = false;
	}

	return {
		cancel: function () {
			var index = group[ key ].indexOf( callback );
			if ( ~index ) { group[ key ].splice( index, 1 ); }
		}
	};
}

function on ( eventName, handler ) {
	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
	handlers.push( handler );

	return {
		cancel: function () {
			var index = handlers.indexOf( handler );
			if ( ~index ) { handlers.splice( index, 1 ); }
		}
	};
}

function set ( newState ) {
	this._set( newState );
	( this._root || this )._flush();
}

function _flush () {
	var this$1 = this;

	if ( !this._renderHooks ) { return; }

	while ( this._renderHooks.length ) {
		var hook = this$1._renderHooks.pop();
		hook.fn.call( hook.context );
	}
}

function noop () {}

function dispatchObservers ( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) { continue; }

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) { continue; }

		var callbacks = group[ key ];
		if ( !callbacks ) { continue; }

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) { continue; }

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

var BaseContent = (function (Content$$1) {
    function BaseContent(component) {
        Content$$1.call(this, null);
        this.component = component;

        this.children[0] =  new (this.component.getContentType('paragraph'))(this);
    }

    if ( Content$$1 ) BaseContent.__proto__ = Content$$1;
    BaseContent.prototype = Object.create( Content$$1 && Content$$1.prototype );
    BaseContent.prototype.constructor = BaseContent;

    BaseContent.prototype.create = function create (node, cursor) {
        Content$$1.prototype.create.call(this, node);
        this.children.forEach(function (child) { return child.create(node); });
        cursor.update();
    };

    BaseContent.prototype.removeChild = function removeChild (child, cursor) {
        if (this.children.length === 1) {
            return; // can't remove last child
        }
        var index = this.children.indexOf(child);
        this.children.splice(index, 1);
        child.remove();
        if (index === 0) {
            this.children[0].focusStart(cursor);
        } else {
            this.children[index - 1].focusEnd(cursor);
        }
        cursor.update();
    };

    BaseContent.prototype.handle = function handle (event, cursor, data) {
        var this$1 = this;

        var content = cursor.getCurrentContent();

        switch (event) {
            case 'change':
                if (content.supportsMultiLine) {
                    content.handle(event, cursor, data);
                } else {
                    // split it up
                    var split = data.split('\n');
                    content.handle(event, cursor, split[0]);
                    for (var i = 1; i < split.length; i++) {
                        var cloned = content.clone();
                        cloned.create(this$1.node);
                        this$1.children.push(cloned);
                        cursor.setCurrentContent(cloned);
                        cursor.setIndex(0);
                        cloned.handle(event, cursor, split[i]);
                    }
                }
                cursor.update();
                break;
            case 'delete':
                content.handle(event, cursor, data);
                cursor.update();
                break;
            case 'deleteWord':
                content.handle(event, cursor, data);
                cursor.update();
                break;
            default:
                console.error('Unknown event', event);
        }
    };

    return BaseContent;
}(Content));

var Cursor = function Cursor(baseContent) {
    this.baseContent = baseContent;
    this.content = baseContent.children[0];
    this.index = 0; // index is the position INSIDE of the current content

    var element = this.element = document.createElement('div');
    element.classList.add('plein-cursor');
    element.style.position = 'fixed';
    element.style.display = 'block';
    element.style.width = '2px';
    element.style.backgroundColor = '#000';

    document.body.appendChild(element);
};

Cursor.prototype.getCurrentContent = function getCurrentContent () {
    return this.content;
};

Cursor.prototype.setCurrentContent = function setCurrentContent (content) {
    this.content = content;
};

Cursor.prototype.setIndex = function setIndex (index) {
    this.index = index;
};

Cursor.prototype.getIndex = function getIndex () {
    return this.index;
};

Cursor.prototype.moveForward = function moveForward (characters) {
    this.setIndex(this.index + characters);
};

Cursor.prototype.update = function update () {
    var ref = this;
        var content = ref.content;
    var coords = content.getCursorCoords(this);
    var height = content.getHeight();

    this.element.style.height = height + "px";
    this.element.style.top = (coords.top) + "px";
    this.element.style.left = (coords.right) + "px";
};

var addedCss$1 = false;
function addCss$1 () {
	var style = createElement( 'style' );
	style.textContent = "\n    p[svelte-410863998], [svelte-410863998] p {\n        white-space: pre-wrap;\n        word-break: break-all;\n    }\n";
	appendNode( style, document.head );

	addedCss$1 = true;
}

function renderMainFragment$1 ( root, component ) {
	var p = createElement( 'p' );
	setAttribute( p, 'svelte-410863998', '' );
	component.refs.node = p;
	p.style.cssText = root.styles;
	
	var text = createText( root.text );
	appendNode( text, p );

	return {
		mount: function ( target, anchor ) {
			insertNode( p, target, anchor );
		},
		
		update: function ( changed, root ) {
			p.style.cssText = root.styles;
			
			text.data = root.text;
		},
		
		teardown: function ( detach ) {
			if ( component.refs.node === p ) { component.refs.node = null; }
			
			if ( detach ) {
				detachNode( p );
			}
		}
	};
}

function ParagraphRenderer ( options ) {
	options = options || {};
	
	this.refs = {};
	this._state = options.data || {};

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root;
	this._yield = options._yield;

	if ( !addedCss$1 ) { addCss$1(); }
	
	this._fragment = renderMainFragment$1( this._state, this );
	if ( options.target ) { this._fragment.mount( options.target, null ); }
}

ParagraphRenderer.prototype.get = get;
ParagraphRenderer.prototype.fire = fire;
ParagraphRenderer.prototype.observe = observe;
ParagraphRenderer.prototype.on = on;
ParagraphRenderer.prototype.set = set;
ParagraphRenderer.prototype._flush = _flush;

ParagraphRenderer.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) { this._fragment.update( newState, this._state ); }
	dispatchObservers( this, this._observers.post, newState, oldState );
};

ParagraphRenderer.prototype.teardown = function teardown ( detach ) {
	this.fire( 'teardown' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
};

var ParagraphContentType = (function (Content$$1) {
    function ParagraphContentType(parent) {
        Content$$1.call(this, parent);
        console.log('using', parent);

        this.text = '';
    }

    if ( Content$$1 ) ParagraphContentType.__proto__ = Content$$1;
    ParagraphContentType.prototype = Object.create( Content$$1 && Content$$1.prototype );
    ParagraphContentType.prototype.constructor = ParagraphContentType;

    ParagraphContentType.prototype.getHeight = function getHeight () {
        if (this._lastStyles && this._lastStyles === JSON.stringify(this.styles)) {
            return this._lastHeight;
        }
        // tl;dr because the element inside the document body can wrap the height can be different
        // than the actual height of the unwrapped-element
        var fakeElem = document.createElement('p');
        fakeElem.innerText = 'I';
        var styles = Object.assign({}, this.styles);
        if (styles.textIndent === -9999) {
            styles.textIndent = undefined;
        }
        fakeElem.setAttribute('style', toString(styles));
        document.body.appendChild(fakeElem);
        var height = fakeElem.clientHeight;
        document.body.removeChild(fakeElem);

        this._lastStyles = JSON.stringify(this.styles);
        this._lastHeight = height;
        return height;
    };

    ParagraphContentType.prototype.getCursorCoords = function getCursorCoords (cursor) {
        var range = this._range = this._range || document.createRange();
        if (this.text.length === 0) {
            range.selectNode(this.renderer.refs.node.childNodes[0]);
            var bounds = range.getBoundingClientRect();
            return {
                top: bounds.top,
                right: bounds.right + 9999 - bounds.width
            };
        } else {
            range.setStart(this.renderer.refs.node.childNodes[0], cursor.getIndex() - 1);
            range.setEnd(this.renderer.refs.node.childNodes[0], cursor.getIndex());
        }
        return range.getBoundingClientRect();
    };

    // override
    ParagraphContentType.prototype.clone = function clone () {
        return new ParagraphContentType(this.parent);
    };

    // override
    ParagraphContentType.prototype.create = function create (node) {
        Content$$1.prototype.create.call(this, node);

        this.renderer = new ParagraphRenderer({
            target: node,
            data: {
                text: this.text,
                styles: toString(this.styles)
            }
        });
        this.updateText(this.text);
    };

    ParagraphContentType.prototype.remove = function remove () {
        this.renderer.teardown();
    };

    // override
    ParagraphContentType.prototype.updateCSS = function updateCSS () {
        this.renderer.set({styles: toString(this.styles)});
    };

    ParagraphContentType.prototype.updateText = function updateText (text) {
        this.text = text;
        if (text.length === 0) {
            this.styles.textIndent = -9999;
            this.updateCSS();
        } else if (this.styles.textIndent) {
            this.styles.textIndent = undefined;
            this.updateCSS();
        }
        this.renderer.set({
            text: text.length === 0 ? 'I' : text
        });
    };

    ParagraphContentType.prototype.focusStart = function focusStart (cursor) {
        cursor.setCurrentContent(this);
        cursor.setIndex(0);
    };

    ParagraphContentType.prototype.focusEnd = function focusEnd (cursor) {
        cursor.setCurrentContent(this);
        cursor.setIndex(this.text.length);
    };

    // override
    ParagraphContentType.prototype.handle = function handle (event, cursor, data) {
        switch (event) {
            case 'change':
                var index = cursor.getIndex();
                cursor.moveForward(data.length);
                this.updateText(this.text.substring(0, index) + data + this.text.substring(index));
                break;
            case 'delete':
                if (this.text.length === 0) {
                    this.parent.removeChild(this, cursor);
                    return;
                }
                this.updateText(this.text.substring(0, cursor.getIndex() - data));
                cursor.moveForward(-data);
                break;
            case 'deleteWord':
                if (this.text.length === 0) {
                    this.parent.removeChild(this, cursor);
                    return;
                }
                var possible = this.text.substring(0, cursor.getIndex());
                var space = Math.max(0, possible.search(/ [^ ]*$/));
                if (cursor.getIndex() - space === 1) {
                    possible = this.text.substring(0, cursor.getIndex() - 1);
                    space = Math.max(0, possible.search(/ [^ ]*$/));
                }
                this.updateText(this.text.substring(0, space) + this.text.substring(cursor.getIndex()));
                cursor.moveForward(space - cursor.getIndex());
                break;
        }
    };

    return ParagraphContentType;
}(Content));
ParagraphContentType.ID = 'paragraph';

var template = (function () {
    // this should be the only content type included
    return {
        data: function data() {
            var data = {};
            var self = this;
            return {
                '_methods': self.methods,
                'types': {
                    'paragraph': ParagraphContentType
                }
            };
        },
        onrender: function onrender() {
            var this$1 = this;

            var methods = this.get('_methods');
            Object.keys(methods).forEach(function (method) { return methods[method] = methods[method].bind(this$1); });

            var content = new BaseContent(methods);
            var cursor = new Cursor(content);
            this.set({
                'content': content,
                'cursor': cursor,
                '_methods': undefined
            });

            this.get('content').create(this.refs.content, cursor);
        },
        methods: {
            handle: function handle() {
                var text = this.refs.input.value;
                this.get('content').handle('change', this.get('cursor'), text);
                this.refs.input.value = '';
            },
            focus: function focus() {
                this.refs.input.focus();
            },
            registerContentType: function registerContentType(contentType) {
                if (typeof contentType.ID !== 'string') {
                    throw new Error('Content type does not have ID!');
                }
                this.get('types')[contentType.ID] = contentType;
            },
            getContentType: function getContentType(id) {
                return this.get('types')[id];
            },
            keydown: function keydown(event) {
                console.log(event.keyCode);
                switch (event.keyCode) {
                    case 8: // space
                        var isMac = ~navigator.platform.toUpperCase().indexOf('MAC');
                        if ((isMac && event.metaKey) || (!isMac && event.ctrlKey)) {
                            this.get('content').handle('deleteWord', this.get('cursor'));
                        } else {
                            this.get('content').handle('delete', this.get('cursor'), 1);
                        }
                        break;
                    case 37: // left
                        break;
                    case 38: // up
                        break;
                    case 39: // right
                        break;
                    case 40: // down
                        break;
                }
            },
            keyup: function keyup(event) {
            }
        }
    };
}());

var addedCss = false;
function addCss () {
	var style = createElement( 'style' );
	style.textContent = "\n    .plein-container[svelte-249150395], [svelte-249150395] .plein-container {\n        position: relative;\n        min-height: 18px;\n        max-height: 100%;\n\n        overflow-y: auto;\n        cursor: text;\n    }\n\n    .plein-input[svelte-249150395], [svelte-249150395] .plein-input {\n        position: absolute;\n\n        border: 0;\n        padding: 0;\n        margin: 0;\n        resize: none;\n\n        overflow: hidden;\n\n        \n        opacity: 0.2;\n    }\n\n    .plein-content[svelte-249150395], [svelte-249150395] .plein-content {\n        position: absolute;\n        width: 100%;\n        height: 100%;\n    }\n";
	appendNode( style, document.head );

	addedCss = true;
}

function renderMainFragment ( root, component ) {
	var div = createElement( 'div' );
	setAttribute( div, 'svelte-249150395', '' );
	div.className = "plein-container";
	
	function clickHandler ( event ) {
		component.focus();
	}
	
	addEventListener( div, 'click', clickHandler );
	
	var textarea = createElement( 'textarea' );
	setAttribute( textarea, 'svelte-249150395', '' );
	textarea.className = "plein-input";
	component.refs.input = textarea;
	
	function inputHandler ( event ) {
		component.handle(event);
	}
	
	addEventListener( textarea, 'input', inputHandler );
	
	function keydownHandler ( event ) {
		component.keydown(event);
	}
	
	addEventListener( textarea, 'keydown', keydownHandler );
	
	function keyupHandler ( event ) {
		component.keyup(event);
	}
	
	addEventListener( textarea, 'keyup', keyupHandler );
	
	appendNode( textarea, div );
	appendNode( createText( "\n    " ), div );
	
	var div1 = createElement( 'div' );
	setAttribute( div1, 'svelte-249150395', '' );
	div1.className = "plein-content";
	component.refs.content = div1;
	
	appendNode( div1, div );

	return {
		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
		},
		
		update: noop,
		
		teardown: function ( detach ) {
			removeEventListener( div, 'click', clickHandler );
			if ( component.refs.input === textarea ) { component.refs.input = null; }
			removeEventListener( textarea, 'input', inputHandler );
			removeEventListener( textarea, 'keydown', keydownHandler );
			removeEventListener( textarea, 'keyup', keyupHandler );
			if ( component.refs.content === div1 ) { component.refs.content = null; }
			
			if ( detach ) {
				detachNode( div );
			}
		}
	};
}

function index$1 ( options ) {
	options = options || {};
	
	this.refs = {};
	this._state = Object.assign( template.data(), options.data );

	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};

	this._handlers = Object.create( null );

	this._root = options._root;
	this._yield = options._yield;

	if ( !addedCss ) { addCss(); }
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) { this._fragment.mount( options.target, null ); }
	
	if ( options._root ) {
		options._root._renderHooks.push({ fn: template.onrender, context: this });
	} else {
		template.onrender.call( this );
	}
}

index$1.prototype = template.methods;

index$1.prototype.get = get;
index$1.prototype.fire = fire;
index$1.prototype.observe = observe;
index$1.prototype.on = on;
index$1.prototype.set = set;
index$1.prototype._flush = _flush;

index$1.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) { this._fragment.update( newState, this._state ); }
	dispatchObservers( this, this._observers.post, newState, oldState );
};

index$1.prototype.teardown = function teardown ( detach ) {
	this.fire( 'teardown' );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
};

var plein = new index$1({
    target: document.getElementById('container')
});
plein.focus();

}());
