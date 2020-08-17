const puppeteer = require('puppeteer');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const SCREENSHOTS_PATH = './__tests__/screenshots';

describe( 'Loading main.html', () => {
    
    let browser, page;

    beforeAll( async () => {

        browser = await puppeteer.launch( {
            headless: false,
            slowMo: 50
        } );

        page = await browser.newPage();

        page.emulate( {
            viewport: {
                width: 800,
                height: 600
            },
            userAgent: ''
        } );

        await page.goto( 'file:///c:/github/canvas/main.html' );

    } );

    afterAll( () => {

        browser.close();

    } );

    test( 'Checking <h3>', async () => {

        const selector = 'h3';
        await page.waitForSelector( selector );
        const result = await page.$eval( selector, e => e.innerHTML );
        expect( result ).toBe( 'Hello FabricJS!' );

    }, 16000 );

    test( 'Checking #showCanvasMode', async () => {

        const selector = '#showCanvasMode';
        await page.waitForSelector( selector );
        const result = await page.$eval( selector, e => e.innerHTML );
        expect( result ).toBe( 'Mode:drawing' );

    }, 16000 );

    describe( 'Drawing on canvas', () => {
    
        let canvas, bounds;
    
        beforeAll( async () => {    

            canvas = await page.$( '#canvas' );
            bounds = await page.evaluate( canvas => {
                const { top, left, bottom, right } = canvas.getBoundingClientRect();
                return { top, left, bottom, right };
            }, canvas );

        } );
    
        test( 'Checking canvas left bound', () => {
            expect( parseInt( bounds.left ) ).toBe( 8 );
        }, 16000 );

        test( 'Checking canvas top bound', () => {
            expect( parseInt( bounds.top ) ).toBe( 136 );
        }, 16000 );

        test( 'Checking canvas right bound', () => {
            expect( parseInt( bounds.right ) ).toBe( 1010 );
        }, 16000 );

        test( 'Checking canvas bottom bound', () => {
            expect( parseInt( bounds.bottom ) ).toBe( 1138 );        
        }, 16000 );

        test( 'Drawing default shape-color', async () => {    
            
            await page.mouse.move( bounds.left + 20, bounds.top + 20 );
            await page.mouse.down();
            await page.mouse.move( bounds.left + 40, bounds.top + 40 );
            await page.mouse.up();

            let result = await page.$eval( '#showShapeType', e => e.innerHTML );
            expect( result ).toBe( 'Shape:rect' );
    
            result = await page.$eval( '#showStylingFill', e => e.innerHTML );
            expect( result ).toBe( 'Fill:black' );

        }, 16000 );

        test( 'Drawing a yellow triangle', async () => {    
            
            await page.click('#triangle');
            await page.click('#yellow');
            await page.mouse.move( bounds.left + 40, bounds.top + 40 );
            await page.mouse.down();
            await page.mouse.move( bounds.left + 60, bounds.top + 60 );
            await page.mouse.up();

            let result = await page.$eval( '#showShapeType', e => e.innerHTML );
            expect( result ).toBe( 'Shape:triangle' );
    
            result = await page.$eval( '#showStylingFill', e => e.innerHTML );
            expect( result ).toBe( 'Fill:yellow' );

        }, 16000 );

        test( 'Drawing a blue circle', async () => {    
            
            await page.click('#circle');
            await page.click('#blue');
            await page.mouse.move( bounds.left + 60, bounds.top + 60 );
            await page.mouse.down();
            await page.mouse.move( bounds.left + 80, bounds.top + 80 );
            await page.mouse.up();

            let result = await page.$eval( '#showShapeType', e => e.innerHTML );
            expect( result ).toBe( 'Shape:circle' );
    
            result = await page.$eval( '#showStylingFill', e => e.innerHTML );
            expect( result ).toBe( 'Fill:blue' );

        }, 16000 );

        test( 'Drawing free', async () => {    
            
            await page.click('#free');
            await page.mouse.move( bounds.left + 80, bounds.top + 80 );
            await page.mouse.down();
            await page.mouse.move( bounds.left + 100, bounds.top + 100 );
            await page.mouse.move( bounds.left + 120, bounds.top + 60 );
            await page.mouse.move( bounds.left + 140, bounds.top + 160 );
            await page.mouse.move( bounds.left + 141, bounds.top + 161 );  // cause not drawing last segment
            await page.mouse.up();

            let result = await page.$eval( '#showShapeType', e => e.innerHTML );
            expect( result ).toBe( 'Shape:free' );
    
        }, 16000 );

        test( 'Checking a screenshot', async () => {

            if ( !fs.existsSync(`${SCREENSHOTS_PATH}/toBe/screenshot1.png`) ) {
                await page.screenshot({path: `${SCREENSHOTS_PATH}/toBe/screenshot1.png`});
            }
            await page.screenshot({path: `${SCREENSHOTS_PATH}/expect/screenshot1.png`});

            return new Promise( ( resolve, reject ) => {
                const imgToBe = fs.createReadStream( `${SCREENSHOTS_PATH}/toBe/screenshot1.png` ).pipe( new PNG() ).on( 'parsed', doneReading );
                const imgExpect = fs.createReadStream( `${SCREENSHOTS_PATH}/expect/screenshot1.png` ).pipe( new PNG() ).on( 'parsed', doneReading );
            
                let filesRead = 0;
                function doneReading() {
                    // Wait until both files are read.
                    if ( ++filesRead < 2 ) return;
            
                    // The files should be the same size.
                    expect( imgExpect.width ).toBe( imgToBe.width );
                    expect( imgExpect.height ).toBe( imgToBe.height );
            
                    // Do the visual diff.
                    const { width, height } = imgToBe;
                    const diff = new PNG( { width, height} );
                    const numDiffPixels = pixelmatch(
                        imgToBe.data, imgExpect.data, diff.data, width, height, { threshold: 0.1 }
                    );
            
                    // The files should look the same.
                    expect( numDiffPixels ).toBe( 0 );
                    resolve();
                }
            } );              
              
        } );
        
    } );

} );
