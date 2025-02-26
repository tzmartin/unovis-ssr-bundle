/**
 * @file Bundle entry point for Unovis SSR
 * @description This file exports a subset of Unovis components configured for server-side rendering
 * and static chart generation. The exported components are accessible via the global Unovis object
 * when the bundle is loaded in a browser environment.
 */

import { 
  XYContainer, 
  Line, 
  Axis,
  SingleContainer,
  StackedBar,
  Donut,
  Scatter,
  Timeline
} from '@unovis/ts';

/**
 * Bundle of Unovis components configured for SSR
 * @namespace Unovis
 */
const Unovis = {
  /** XY Container component for cartesian visualizations */
  XYContainer,
  /** Line component for creating line charts */
  Line,
  /** Axis component for adding scales and labels */
  Axis,
  /** Single container for individual chart components */
  SingleContainer,
  /** Stacked bar component for bar charts */
  StackedBar,
  /** Donut chart component */
  Donut,
  /** Scatter plot component */
  Scatter,
  /** Timeline component for temporal data */
  Timeline
};

// Type declaration for window object
declare global {
  interface Window {
    Unovis: typeof Unovis;
  }
}

window.Unovis = Unovis;

export default Unovis; 