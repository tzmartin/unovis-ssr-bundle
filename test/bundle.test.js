import { expect, test, describe } from "bun:test";
import { readFile } from 'node:fs/promises';

describe('Unovis Bundle', () => {
  test('bundle file exists', async () => {
    const bundlePath = './dist/unovis-bundle.js';
    const content = await readFile(bundlePath, 'utf-8');
    expect(content).toBeTruthy();
  });

  test('bundle exports expected components', async () => {
    const bundlePath = './dist/unovis-bundle.js';
    const content = await readFile(bundlePath, 'utf-8');
    
    // Check for component exports
    const expectedComponents = [
      'XYContainer',
      'Line',
      'Axis',
      'SingleContainer',
      'StackedBar',
      'Donut',
      'Scatter',
      'Timeline'
    ];

    expectedComponents.forEach(component => {
      expect(content.includes(component)).toBe(true);
    });
  });
}); 