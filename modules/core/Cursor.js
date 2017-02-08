export default class Cursor {
    constructor(baseContent) {
        this.baseContent = baseContent;
        this.content = baseContent.children[0];
        this.index = 0; // index is the position INSIDE of the current content

        const element = this.element = document.createElement('div');
        element.classList.add('plein-cursor');
        element.style.position = 'fixed';
        element.style.display = 'block';
        element.style.width = '2px';
        element.style.backgroundColor = '#000';

        document.body.appendChild(element);
    }

    getCurrentContent() {
        return this.content;
    }

    setCurrentContent(content) {
        this.content = content;
    }

    setIndex(index) {
        this.index = index;
    }

    getIndex() {
        return this.index;
    }

    moveForward(characters) {
        this.setIndex(this.index + characters);
    }

    update() {
        const {content} = this;
        const coords = content.getCursorCoords(this);
        const height = content.getHeight();

        this.element.style.height = `${height}px`;
        this.element.style.top = `${coords.top}px`;
        this.element.style.left = `${coords.right}px`;
    }

    // todo move stuff
}