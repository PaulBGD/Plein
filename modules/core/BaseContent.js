import Content from '../shared/Content';

export default class BaseContent extends Content {
    constructor(component) {
        super(null);
        this.component = component;

        this.children[0] =  new (this.component.getContentType('paragraph'))(this);
    }

    create(node, cursor) {
        super.create(node);
        this.children.forEach(child => child.create(node));
        cursor.update();
    }

    removeChild(child, cursor) {
        if (this.children.length === 1) {
            return; // can't remove last child
        }
        const index = this.children.indexOf(child);
        this.children.splice(index, 1);
        child.remove();
        if (index === 0) {
            this.children[0].focusStart(cursor);
        } else {
            this.children[index - 1].focusEnd(cursor);
        }
        cursor.update();
    }

    handle(event, cursor, data) {
        const content = cursor.getCurrentContent();

        switch (event) {
            case 'change':
                if (content.supportsMultiLine) {
                    content.handle(event, cursor, data);
                } else {
                    // split it up
                    const split = data.split('\n');
                    content.handle(event, cursor, split[0]);
                    for (let i = 1; i < split.length; i++) {
                        const cloned = content.clone();
                        cloned.create(this.node);
                        this.children.push(cloned);
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
    }
}
