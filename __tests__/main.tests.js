const puppeteer = require('puppeteer');

describe( 'Loading main.html', () => {
    
    let browser, page;

    beforeAll( async () => {

        browser = await puppeteer.launch( {
            headless: false,
            slowMo: 150
        } );

        page = await browser.newPage();

        page.emulate( {
            viewport: {
                width: 500,
                height: 2400
            },
            userAgent: ''
        } );

        await page.goto( 'file:///c:/github/canvas/main.html' );

    } );

    afterAll( () => {

        browser.close();

    } );

    test('Checking <h3>', async () => {

        const selector = 'h3';
        await page.waitForSelector( selector );
        const result = await page.$eval( selector, e => e.innerHTML );
        expect( result ).toBe( 'Hello FabricJS!' );

    }, 16000);

    test('Checking #showCanvasMode', async () => {

        const selector = '#showCanvasMode';
        await page.waitForSelector( selector );
        const result = await page.$eval( selector, e => e.innerHTML );
        expect( result ).toBe( 'Mode:drawing' );

    }, 16000);

    describe( 'Drawing on canvas', () => {
    
        let canvas, bound;
    
        beforeAll( async () => {    

            canvas = await page.$( '#canvas' );
            bound = await page.evaluate( canvas => {
                const { top, left } = canvas.getBoundingClientRect();
                return { top, left };
            }, canvas );

        } );
    
        test('Checking top and left', () => {

            expect( parseInt( bound.left ) ).toBe( 8 );
            expect( parseInt( bound.top ) ).toBe( 136 );
        
        }, 16000);

        test('Drawing default shape-color', async () => {    
            
            await page.mouse.move( bound.left + 20, bound.top + 20 );
            await page.mouse.down();
            await page.mouse.move( bound.left + 40, bound.top + 40 );
            await page.mouse.up();

            let result = await page.$eval( '#showShapeType', e => e.innerHTML );
            expect( result ).toBe( 'Shape:rect' );
    
            result = await page.$eval( '#showStylingFill', e => e.innerHTML );
            expect( result ).toBe( 'Fill:black' );

        }, 16000);

        test('Drawing a yellow triangle', async () => {    
            
            await page.click('#triangle');
            await page.click('#yellow');
            await page.mouse.move( bound.left + 40, bound.top + 40 );
            await page.mouse.down();
            await page.mouse.move( bound.left + 60, bound.top + 60 );
            await page.mouse.up();

            let result = await page.$eval( '#showShapeType', e => e.innerHTML );
            expect( result ).toBe( 'Shape:triangle' );
    
            result = await page.$eval( '#showStylingFill', e => e.innerHTML );
            expect( result ).toBe( 'Fill:yellow' );

        }, 16000);

        test('Drawing a magenta circle', async () => {    
            
            await page.click('#circle');
            await page.click('#magenta');
            await page.mouse.move( bound.left + 60, bound.top + 60 );
            await page.mouse.down();
            await page.mouse.move( bound.left + 80, bound.top + 80 );
            await page.mouse.up();

            let result = await page.$eval( '#showShapeType', e => e.innerHTML );
            expect( result ).toBe( 'Shape:circle' );
    
            result = await page.$eval( '#showStylingFill', e => e.innerHTML );
            expect( result ).toBe( 'Fill:magenta' );

        }, 16000);

    } );

} );
