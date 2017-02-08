import {pointToPixel} from './constants';

export default class Content {
    constructor(parent) {
        console.log('setting', parent);
        this.parent = parent;
        this.children = [];

        this.supportsMultiLine = false;

        this.styles = {
            fontSize: pointToPixel(12)
        };
    }

    getHeight() {
        throw new Error('Height not implemented!');
    }

    create(node) {
        this.node = node;
    }

    handle(event, target, data) {
        console.error('Unhandled event', event, target, data, this);
    }

    setPointSize(pt) {
        this.styles.fontSize = pointToPixel(pt);
        this.updateCSS();
    }

    clone() {
        console.error('Clone not implemented.');
    }

    updateCSS() {
        console.error('Update CSS not implemented.');
    }
}