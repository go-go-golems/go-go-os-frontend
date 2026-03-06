import { useContext, useEffect, useReducer } from 'react';
import { RadioButton } from '@hypercard/engine';
import { ReactReduxContext, useDispatch, useSelector } from 'react-redux';
import { RICH_PARTS as P } from '../parts';
import { ChartCanvas } from './ChartCanvas';
import { LegendBar } from './LegendBar';
import { SAMPLE_DATASETS } from './sampleData';
import {
  CHART_VIEW_STATE_KEY,
  chartViewActions,
  chartViewReducer,
  createChartViewStateSeed,
  selectChartViewState,
  type ChartViewAction,
  type ChartViewState,
} from './chartViewState';
import type { ChartType, ChartDataset } from './types';

export interface ChartViewProps {
  data: ChartDataset;
  initialChartType?: ChartType;
  width?: number;
  height?: number;
  title?: string;
  availableTypes?: ChartType[];
  datasets?: Record<string, ChartDataset>;
}

const CHART_TYPE_OPTIONS: Array<{ value: ChartType; label: string }> = [
  { value: 'line', label: '📈 Line' },
  { value: 'bar', label: '📊 Bar' },
  { value: 'pie', label: '🥧 Pie' },
  { value: 'scatter', label: '⭐ Scatter' },
];

function createInitialSeed(props: Partial<ChartViewProps>): ChartViewState {
  const datasetKeys = props.datasets ? Object.keys(props.datasets) : [];
  return createChartViewStateSeed({
    chartType: props.initialChartType,
    datasetKey: datasetKeys[0] ?? '',
  });
}

function ChartViewFrame({
  state,
  dispatch,
  initialData,
  width,
  height,
  title,
  availableTypes,
  datasets,
}: {
  state: ChartViewState;
  dispatch: (action: ChartViewAction) => void;
  initialData: ChartDataset;
  width: number;
  height: number;
  title?: string;
  availableTypes?: ChartType[];
  datasets?: Record<string, ChartDataset>;
}) {
  const data = datasets ? (datasets[state.datasetKey] ?? initialData) : initialData;
  const types = availableTypes ?? CHART_TYPE_OPTIONS.map((option) => option.value);

  return (
    <div data-part={P.cv}>
      <div data-part={P.cvCanvas}>
        {title && (
          <div
            style={{
              fontWeight: 'bold',
              fontSize: 11,
              textAlign: 'center',
              padding: '4px 0',
              borderBottom: '1px solid var(--hc-color-border)',
            }}
          >
            📊 {title} — {state.chartType.charAt(0).toUpperCase() + state.chartType.slice(1)} Chart
          </div>
        )}
        <ChartCanvas chartType={state.chartType} data={data} width={width} height={height} />
        {data.series.length > 0 && <LegendBar series={data.series} chartType={state.chartType} />}
      </div>

      <div data-part={P.cvControls}>
        <div data-part={P.cvControlGroup}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 'bold',
              borderBottom: '1px solid var(--hc-color-border)',
              paddingBottom: 2,
              marginBottom: 6,
            }}
          >
            Chart Type
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {CHART_TYPE_OPTIONS.filter((option) => types.includes(option.value)).map((option) => (
              <RadioButton
                key={option.value}
                label={option.label}
                selected={state.chartType === option.value}
                onChange={() => dispatch(chartViewActions.setChartType(option.value))}
              />
            ))}
          </div>
        </div>

        {datasets && (
          <div data-part={P.cvControlGroup}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 'bold',
                borderBottom: '1px solid var(--hc-color-border)',
                paddingBottom: 2,
                marginBottom: 6,
              }}
            >
              Dataset
            </div>
            <select
              data-part="field-input"
              value={state.datasetKey}
              onChange={(event) => dispatch(chartViewActions.setDatasetKey(event.target.value))}
              style={{ width: '100%', fontSize: 11 }}
            >
              {Object.keys(datasets).map((datasetKey) => (
                <option key={datasetKey} value={datasetKey}>
                  {datasetKey}
                </option>
              ))}
            </select>
          </div>
        )}

        <div data-part={P.cvInfo}>
          <b>ℹ️ Info</b>
          <br />
          Series: {data.series.length}
          <br />
          Points: {data.labels.length}
          <br />
          Max: {Math.max(...data.series.flatMap((seriesItem) => seriesItem.values))}
        </div>
      </div>
    </div>
  );
}

function StandaloneChartView(props: Partial<ChartViewProps>) {
  const [state, dispatch] = useReducer(chartViewReducer, createInitialSeed(props));
  return (
    <ChartViewFrame
      state={state}
      dispatch={dispatch}
      initialData={props.data ?? SAMPLE_DATASETS['Quarterly Revenue']}
      width={props.width ?? 540}
      height={props.height ?? 320}
      title={props.title}
      availableTypes={props.availableTypes}
      datasets={props.datasets}
    />
  );
}

function ConnectedChartView(props: Partial<ChartViewProps>) {
  const reduxDispatch = useDispatch();
  const state = useSelector(selectChartViewState);

  useEffect(() => {
    reduxDispatch(chartViewActions.initializeIfNeeded(createInitialSeed(props)));
  }, [props.datasets, props.initialChartType, reduxDispatch]);

  const effectiveState = state.initialized ? state : createInitialSeed(props);
  return (
    <ChartViewFrame
      state={effectiveState}
      dispatch={(action) => reduxDispatch(action)}
      initialData={props.data ?? SAMPLE_DATASETS['Quarterly Revenue']}
      width={props.width ?? 540}
      height={props.height ?? 320}
      title={props.title}
      availableTypes={props.availableTypes}
      datasets={props.datasets}
    />
  );
}

export function ChartView(props: Partial<ChartViewProps> = {}) {
  const reduxContext = useContext(ReactReduxContext);
  const store = reduxContext?.store;
  const rootState = store?.getState();
  const hasRegisteredSlice =
    typeof rootState === 'object' &&
    rootState !== null &&
    CHART_VIEW_STATE_KEY in (rootState as Record<string, unknown>);

  if (hasRegisteredSlice) {
    return <ConnectedChartView {...props} />;
  }

  return <StandaloneChartView {...props} />;
}
