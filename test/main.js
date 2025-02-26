import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Include the bundle as a static asset
const UNOVIS_BUNDLE = await Bun.file("dist/unovis-bundle.js").text();

async function renderVisualization(data, outputPath, options = {}) {
  const {
    width = 1600,
    height = 900,
    dpi = 2
  } = options;

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
      '--disable-gpu',
      '--disable-web-security'
    ]
  });
  const page = await browser.newPage();

  // Set high-DPI viewport with explicit device settings
  await page.setViewport({
    width: width + 80,
    height: height + 80,
    deviceScaleFactor: dpi,
    isMobile: false,
    hasTouch: false,
    isLandscape: true
  });

  // Enable detailed logging
  page.on('console', msg => console.log('Browser log:', msg.text()));
  page.on('pageerror', err => console.error('Browser error:', err.message));

  // First load D3
  await page.goto('about:blank');
  await page.addScriptTag({
    url: 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js',
    type: 'text/javascript'
  });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unovis Visualization</title>
      <style>
        body {
          background: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        
        #vis-container { 
          width: ${width}px; 
          height: ${height}px;
          border: none;
          margin: 40px;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .vis-line { 
          stroke: #2196F3 !important;
          stroke-width: 3px !important;
          stroke-opacity: 1 !important;
          fill: none !important;
        }
        
        .vis-scatter-point {
          fill: #2196F3;
        }

        .vis-axis line {
          stroke: #e0e0e0;
          stroke-width: 1px;
        }

        .vis-axis path {
          stroke: #e0e0e0;
          stroke-width: 1px;
        }

        .vis-axis text {
          fill: #666;
          font-size: 24px;
        }

        .vis-axis-label {
          fill: #333;
          font-size: 28px;
          font-weight: 500;
        }

        .vis-grid-line {
          stroke: #f0f0f0;
        }
      </style>
    </head>
    <body>
      <div id="vis-container"></div>
      <div id="error-container" style="color: red;"></div>
      <script>
        // Inject the pre-built Unovis bundle
        ${UNOVIS_BUNDLE}

        try {
          const data = ${JSON.stringify(data)};
          console.log('Data:', data);
          
          const { XYContainer, Line, Scatter, Axis } = window.Unovis;
          
          // Create scatter for points
          const scatter = new Scatter({
            x: d => d.x,
            y: d => d.y,
            size: 12,
            color: '#2196F3'
          });

          // Create line
          const line = new Line({
            x: d => d.x,
            y: d => d.y,
            color: '#2196F3',
            curve: 'curveMonotoneX',
            strokeWidth: 5,
            opacity: 1,
            defined: () => true,
            style: {
              stroke: '#2196F3',
              strokeWidth: 5,
              fill: 'none',
              vectorEffect: 'non-scaling-stroke'
            },
            duration: 0,
            animated: false
          });

          // Create container with both components
          const container = new XYContainer(document.getElementById('vis-container'), {
            components: [line, scatter],
            margin: { top: 40, bottom: 80, left: 100, right: 40 },
            background: '#ffffff',
            duration: 0,
            animated: false,
            clipContent: false,
            xAxis: new Axis({
              label: 'X Values',
              tickFormat: d => d.toString(),
              grid: true,
              gridColor: '#f0f0f0',
              tickSize: 10,
              tickPadding: 10,
              ticks: 6
            }),
            yAxis: new Axis({
              label: 'Y Values',
              tickFormat: d => d.toString(),
              grid: true,
              gridColor: '#f0f0f0',
              tickSize: 10,
              tickPadding: 10,
              ticks: 6
            })
          }, data);

          // Log container state
          console.log('Container:', container);
          console.log('Components:', container.components);
          
          // Signal ready
          const ready = document.createElement('div');
          ready.id = 'vis-ready';
          document.body.appendChild(ready);
        } catch (error) {
          console.error('Error:', error);
          document.getElementById('error-container').textContent = error.message;
        }
      </script>
    </body>
    </html>
  `);

  try {
    await page.waitForSelector('#vis-container', { timeout: 5000 });
    await page.waitForSelector('#vis-ready', { timeout: 5000 });
    
    // Add a longer delay to ensure rendering and animations are complete
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    // Log the actual DOM content
    const svgContent = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      const linePath = svg?.querySelector('.css-142r7hb-linePath');
      const lineStyles = linePath ? window.getComputedStyle(linePath) : null;
      return {
        svg: svg ? svg.outerHTML : 'No SVG found',
        containerHTML: document.getElementById('vis-container').innerHTML,
        error: document.getElementById('error-container').textContent,
        linePathAttrs: linePath ? {
          d: linePath.getAttribute('d'),
          stroke: lineStyles?.stroke,
          strokeWidth: lineStyles?.strokeWidth,
          strokeOpacity: lineStyles?.strokeOpacity,
          opacity: lineStyles?.opacity
        } : 'No line path found'
      };
    });
    
    console.log('Container HTML:', svgContent.containerHTML);
    console.log('SVG content:', svgContent.svg);
    console.log('Error content:', svgContent.error);
    console.log('Line path attributes:', svgContent.linePathAttrs);

    const screenshotBuffer = await page.screenshot({
      path: outputPath,
      clip: {
        x: 0,
        y: 0,
        width: width + 80,
        height: height + 80
      },
      omitBackground: false,
      type: 'png',
      encoding: 'binary',
      captureBeyondViewport: true
    });

    console.log('High-resolution screenshot saved to:', outputPath);
    return screenshotBuffer;
  } catch (error) {
    console.error('Failed:', error);
    const content = await page.content();
    await readFile('debug.html', content);
    console.log('Debug HTML saved');
    throw error;
  } finally {
    await browser.close();
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const usage = `
Usage: chart-gen [options] <output-file>

Options:
  --width <pixels>     Chart width (default: 1600)
  --height <pixels>    Chart height (default: 900)
  --dpi <factor>      Device scale factor (default: 2)
  --data <json>       Data points as JSON string
  --help              Show this help message

Example:
  chart-gen --width 1920 --height 1080 --data '[{"x":0,"y":0},{"x":1,"y":2}]' chart.png
`;

  if (args.includes('--help')) {
    console.log(usage);
    process.exit(0);
  }

  const options = {
    width: 1600,
    height: 900,
    dpi: 2,
    data: null,
    outputPath: null
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--width':
        options.width = parseInt(args[++i], 10);
        break;
      case '--height':
        options.height = parseInt(args[++i], 10);
        break;
      case '--dpi':
        options.dpi = parseInt(args[++i], 10);
        break;
      case '--data':
        try {
          options.data = JSON.parse(args[++i]);
        } catch (e) {
          console.error('Error parsing data JSON:', e);
          process.exit(1);
        }
        break;
      default:
        if (!args[i].startsWith('--')) {
          options.outputPath = args[i];
        }
    }
  }

  // Validate required arguments
  if (!options.outputPath) {
    console.error('Error: Output file path is required');
    console.log(usage);
    process.exit(1);
  }

  if (!options.data) {
    options.data = [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 3, y: 4 },
      { x: 4, y: 3 },
      { x: 5, y: 5 }
    ].sort((a, b) => a.x - b.x);
  }

  try {
    await renderVisualization(options.data, options.outputPath, {
      width: options.width,
      height: options.height,
      dpi: options.dpi
    });
  } catch (error) {
    console.error('Error generating chart:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { renderVisualization };