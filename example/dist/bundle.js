(function () {
'use strict';

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

var template = (function () {
    return {
        data: function data() {
            return {
                content: []
            }
        },
        events: {
            update: function update(node, callback) {
                var stopped = false;

                function run() {
                    if (stopped) {
                        return;
                    }
                    callback(node);

                    if (!stopped) {
                        requestAnimationFrame(run);
                    }
                }
                requestAnimationFrame(run);

                return {
                    teardown: function teardown() {
                        stopped = true;
                    }
                }
            }
        },
        methods: {
            update: function update() {
                this.get('content').forEach(function (content) { return content.update(); });
            }
        }
    };
}());

var addedCss = false;
function addCss () {
	var style = createElement( 'style' );
	style.textContent = "\n    .plein-container[svelte-796711676], [svelte-796711676] .plein-container {\n        position: relative;\n        min-height: 18px;\n        max-height: 100%;\n\n        overflow-y: auto;\n        cursor: text;\n    }\n\n    .plein-input[svelte-796711676], [svelte-796711676] .plein-input {\n        position: absolute;\n\n        border: 0;\n        padding: 0;\n        margin: 0;\n        resize: none;\n\n        overflow: hidden;\n\n        \n        opacity: 0.2;\n    }\n\n    .plein-content[svelte-796711676], [svelte-796711676] .plein-content {\n        position: absolute;\n        width: 100%;\n        height: 100%;\n    }\n";
	appendNode( style, document.head );

	addedCss = true;
}

function renderMainFragment ( root, component ) {
	var div = createElement( 'div' );
	setAttribute( div, 'svelte-796711676', '' );
	div.className = "plein-container";
	
	var textarea = createElement( 'textarea' );
	setAttribute( textarea, 'svelte-796711676', '' );
	textarea.className = "plein-input";
	
	appendNode( textarea, div );
	appendNode( createText( "\n    " ), div );
	
	var div1 = createElement( 'div' );
	setAttribute( div1, 'svelte-796711676', '' );
	div1.className = "plein-content";
	
	var updateHandler = template.events.update.call( component, div1, function ( event ) {
		component.update();
	});
	
	appendNode( div1, div );

	return {
		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
		},
		
		update: noop,
		
		teardown: function ( detach ) {
			updateHandler.teardown();
			
			if ( detach ) {
				detachNode( div );
			}
		}
	};
}

function index$1 ( options ) {
	options = options || {};
	
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

}());
