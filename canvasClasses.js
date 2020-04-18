/* 
 * Canvas: handles canvas
 * Drawing: handles drawing canvas mode
 * Selecting: handles selecting canvas mode
 * Shape: handles drawing shape
 * Styling: handles styling attributes
 * 
**/

class Canvas {
    constructor( className, width, height ) {
        this.canvas = new fabric.Canvas( className );
        this.canvas.setWidth( String( width ) );
        this.canvas.setHeight( String( height ) );
        this.canvas.preserveObjectStacking = true; // Do'nt bring-to-front when objects selected

        this.styling = new Styling();

        this.drawing = new Drawing( this.canvas, this.styling );

        this.selecting = new Selecting( this.canvas );

        this._mode = {
            drawing: false,
            selecting: false,
        };

        this.drawing.shape.type = 'rect';
        this.styling.fill = 'black';
        this.mode = 'drawing';
    }

    set mode( val ) {
        Object.keys( this._mode ).forEach( attr => this._mode[attr] = ( attr === val ? true : false ) );

        if ( this._mode.drawing ) {
            this.canvas.defaultCursor = 'crosshair';
            this.canvas.getObjects().forEach( obj => obj.hoverCursor = this.canvas.defaultCursor );
            this.selecting.disable();
            this.drawing.enable();

        } else { // selecting
            this.canvas.defaultCursor = 'pointer';
            this.canvas.getObjects().forEach( obj => obj.hoverCursor = this.canvas.defaultCursor );
            this.drawing.disable();
            this.selecting.enable();
        };
    }

    get mode() {
        return Object.keys( this._mode ).filter( key => this._mode[ key ] );
    }
}

class Drawing {
    constructor( canvas, styling ) {
        this.canvas = canvas;
        this.styling = styling;
        this.shape = new Shape( this.canvas, this );
        this.enabled = false;
    }

    enable() {
        this.disable();
        if ( this.shape.type === 'free' ) {
            this.canvas.isDrawingMode = true;
        } else {
            this.canvas.on({
                'mouse:down': args => this.start( args ),
                'mouse:move': args => this.continue( args ),
                'mouse:up': () => this.finish(),
                // 'path:created': this.finish,
            });
        };
        this.enabled = true;
    }

    disable() {
        this.canvas.isDrawingMode = false;
        this.canvas.off();
        this.enabled = false;
    }

    start( args ) {
        const cursorX = args.e.layerX;
        const cursorY = args.e.layerY;

        this.shape.createObject({
            fill: 'rgba(0,0,0,0)', // transparent
            strokeWidth: 1,
            stroke: this.styling.fill,
            strokeDashArray: [1, 2], // 1px dot 2px space
            left: cursorX,
            top: cursorY,
            right: cursorX,
            bottom: cursorY,
        });

        this.startX = cursorX;
        this.startY = cursorY;
        this.hasStarted = true;
    }

    continue( args ) {
        if ( this.hasStarted ) {
            const cursorX = args.e.layerX;
            const cursorY = args.e.layerY;
            let left = this.shape.object.left;
            let top = this.shape.object.top;
            let right = this.shape.object.left + this.shape.object.width;
            let bottom = this.shape.object.top + this.shape.object.height;

            left = cursorX < this.startX ? cursorX : this.startX;
            top = cursorY < this.startY ? cursorY : this.startY;
            right = cursorX > this.startX ? cursorX : this.startX;
            bottom = cursorY > this.startY ? cursorY : this.startY;

            this.shape.modifyObject({ left, top, right, bottom });
        };
    }

    finish() {
        if ( this.hasStarted ) {
            const left = this.shape.object.left;
            const top = this.shape.object.top;
            const right = this.shape.object.left + this.shape.object.width;
            const bottom = this.shape.object.top + this.shape.object.height;

            this.canvas.remove( this.shape.object );
            this.shape.createObject({
                fill: this.styling.fill,
                strokeWidth: null,
                stroke: null,
                strokeDashArray: null,
                left,
                top,
                right,
                bottom,
            });

            this.hasStarted = false;
        };
        console.log('drawing completed', this.canvas.getObjects());
    }
}

class Selecting {
    constructor( canvas ) {
        this.canvas = canvas;
    }

    enable() {
        this.canvas.selection = true;
        this.canvas.getObjects().forEach( obj => obj.selectable = true );
    }

    disable() {
        this.canvas.selection = false;
        this.canvas.getObjects().forEach( obj => obj.selectable = false );
    }

    remove() {
        const objects = this.canvas.getActiveObjects();
        objects.forEach( obj => this.canvas.remove( obj ) );
        this.canvas.discardActiveObject();  
    }

    bringToFront() {
        const obj = this.canvas.getActiveObject();
        obj.bringToFront();
    }

    bringForward() {
        const obj = this.canvas.getActiveObject();
        obj.bringForward();
    }

    sendBackwards() {
        const obj = this.canvas.getActiveObject();
        obj.sendBackwards();
    }

    sendToBack() {
        const obj = this.canvas.getActiveObject();
        obj.sendToBack();
    }
}

class Shape {
    constructor( canvas, drawing ) {
        this.canvas = canvas;
        this.drawing = drawing;
        this._type = '';
        this.object = null;
    }

    set type( val ) {
        this._type = val;
        // Due drawing.enable() is based on shape.type
        if ( this.drawing.enabled ) {
            this.drawing.enable();
        };
    }

    get type() {
        return this._type;
    }

    createObject( attributes ) {
        const { fill, strokeWidth, stroke, strokeDashArray, left, top, right, bottom } = attributes;
        const width = right - left;
        const height = bottom -top;
        const radius = ( right - left ) / 2;

        switch( this.type ) {
        case 'rect':
            this.object = new fabric.Rect({ fill, strokeWidth, stroke, strokeDashArray, left, top, width, height });
            this.addToCanvas();
            break;

        case 'triangle':
            this.object = new fabric.Triangle({ fill, strokeWidth, stroke, strokeDashArray, left, top, width, height });
            this.addToCanvas();
            break;

        case 'circle':
            this.object = new fabric.Circle({ fill, strokeWidth, stroke, strokeDashArray, left, top, radius });
            this.addToCanvas();
            break;
        };
    }

    addToCanvas() {
        this.object.selectable = false;
        this.object.hoverCursor = this.canvas.defaultCursor;
        this.canvas.add( this.object );
        this.canvas.renderAll();
    }

    modifyObject( attributes ) {
        const { left, top, right, bottom } = attributes;
        const width = right - left;
        const height = bottom -top;

        if ( this.type === 'circle' ) {
            const radius = Math.min( width, height ) / 2;
            this.object.set({ left, top, width, height, radius });
        } else {
            this.object.set({ left, top, width, height });
        };

        this.canvas.renderAll();
    }
}

class Styling {
    constructor() {
        this.fill = '';
    }
}
