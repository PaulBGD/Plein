import Content from '../../shared/Content';
import {toString} from '../../shared/css';
import ParagraphRenderer from './ParagraphRenderer.html';

export default class ParagraphContentType extends Content {
    constructor(parent) {
        super(parent);
        console.log('using', parent);

        this.text = '';
    }

    getHeight() {
        if (this._lastStyles && this._lastStyles === JSON.stringify(this.styles)) {
            return this._lastHeight;
        }
        // tl;dr because the element inside the document body can wrap the height can be different
        // than the actual height of the unwrapped-element
        const fakeElem = document.createElement('p');
        fakeElem.innerText = 'I';
        const styles = Object.assign({}, this.styles);
        if (styles.textIndent === -9999) {
            styles.textIndent = undefined;
        }
        fakeElem.setAttribute('style', toString(styles));
        document.body.appendChild(fakeElem);
        const height = fakeElem.clientHeight;
        document.body.removeChild(fakeElem);

        this._lastStyles = JSON.stringify(this.styles);
        this._lastHeight = height;
        return height;
    }

    getCursorCoords(cursor) {
        const range = this._range = this._range || document.createRange();
        if (this.text.length === 0) {
            range.selectNode(this.renderer.refs.node.childNodes[0]);
            const bounds = range.getBoundingClientRect();
            return {
                top: bounds.top,
                right: bounds.right + 9999 - bounds.width
            };
        } else {
            range.setStart(this.renderer.refs.node.childNodes[0], cursor.getIndex() - 1);
            range.setEnd(this.renderer.refs.node.childNodes[0], cursor.getIndex());
        }
        return range.getBoundingClientRect();
    }

    // override
    clone() {
        return new ParagraphContentType(this.parent);
    }

    // override
    create(node) {
        super.create(node);

        this.renderer = new ParagraphRenderer({
            target: node,
            data: {
                text: this.text,
                styles: toString(this.styles)
            }
        });
        this.updateText(this.text);
    }

    remove() {
        this.renderer.teardown();
    }

    // override
    updateCSS() {
        this.renderer.set({styles: toString(this.styles)});
    }

    updateText(text) {
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
    }

    focusStart(cursor) {
        cursor.setCurrentContent(this);
        cursor.setIndex(0);
    }

    focusEnd(cursor) {
        cursor.setCurrentContent(this);
        cursor.setIndex(this.text.length);
    }

    // override
    handle(event, cursor, data) {
        switch (event) {
            case 'change':
                const index = cursor.getIndex();
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
                let possible = this.text.substring(0, cursor.getIndex());
                let space = Math.max(0, possible.search(/ [^ ]*$/));
                if (cursor.getIndex() - space === 1) {
                    possible = this.text.substring(0, cursor.getIndex() - 1);
                    space = Math.max(0, possible.search(/ [^ ]*$/));
                }
                this.updateText(this.text.substring(0, space) + this.text.substring(cursor.getIndex()));
                cursor.moveForward(space - cursor.getIndex());
                break;
        }
    }
}
ParagraphContentType.ID = 'paragraph';
