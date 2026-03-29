import { Btn, Checkbox } from '@go-go-golems/os-core';
import { RICH_PARTS as P } from '../parts';
import { LabeledSlider } from '../primitives/LabeledSlider';
import { Separator } from '../primitives/Separator';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { WAVEFORM_ICONS, WAVEFORM_TYPES, type WaveformType } from './types';

export function OscilloscopeControls({
  waveform,
  frequency,
  amplitude,
  timebase,
  offsetY,
  running,
  showGrid,
  showCrosshair,
  channel2,
  ch2Freq,
  ch2Amp,
  phosphor,
  triggerLevel,
  thickness,
  onWaveformChange,
  onFrequencyChange,
  onAmplitudeChange,
  onTimebaseChange,
  onOffsetYChange,
  onRunningChange,
  onShowGridChange,
  onShowCrosshairChange,
  onChannel2Change,
  onCh2FreqChange,
  onCh2AmpChange,
  onPhosphorChange,
  onTriggerLevelChange,
  onThicknessChange,
  onResetTime,
  onResetDefaults,
}: {
  waveform: WaveformType;
  frequency: number;
  amplitude: number;
  timebase: number;
  offsetY: number;
  running: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  channel2: boolean;
  ch2Freq: number;
  ch2Amp: number;
  phosphor: boolean;
  triggerLevel: number;
  thickness: number;
  onWaveformChange: (value: WaveformType) => void;
  onFrequencyChange: (value: number) => void;
  onAmplitudeChange: (value: number) => void;
  onTimebaseChange: (value: number) => void;
  onOffsetYChange: (value: number) => void;
  onRunningChange: (value: boolean) => void;
  onShowGridChange: (value: boolean) => void;
  onShowCrosshairChange: (value: boolean) => void;
  onChannel2Change: (value: boolean) => void;
  onCh2FreqChange: (value: number) => void;
  onCh2AmpChange: (value: number) => void;
  onPhosphorChange: (value: boolean) => void;
  onTriggerLevelChange: (value: number) => void;
  onThicknessChange: (value: number) => void;
  onResetTime: () => void;
  onResetDefaults: () => void;
}) {
  return (
    <>
      <div data-part={P.oscControls}>
        <div data-part={P.oscControlGroup}>
          <div data-part={P.oscControlGroupTitle}>CH1 Waveform</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {WAVEFORM_TYPES.map((waveType) => (
              <Btn
                key={waveType}
                onClick={() => onWaveformChange(waveType)}
                data-state={waveform === waveType ? 'active' : undefined}
                style={{ fontSize: 9, padding: '2px 6px' }}
              >
                {WAVEFORM_ICONS[waveType]} {waveType.slice(0, 3).toUpperCase()}
              </Btn>
            ))}
          </div>
        </div>

        <div data-part={P.oscControlGroup}>
          <div data-part={P.oscControlGroupTitle}>CH1 Parameters</div>
          <LabeledSlider label="Frequency" value={frequency} min={0.1} max={20} step={0.1} onChange={onFrequencyChange} unit=" Hz" />
          <LabeledSlider label="Amplitude" value={amplitude} min={0} max={140} step={1} onChange={onAmplitudeChange} unit="%" />
          <LabeledSlider label="Y Offset" value={offsetY} min={-100} max={100} step={1} onChange={onOffsetYChange} unit=" px" />
        </div>

        <div data-part={P.oscControlGroup}>
          <div data-part={P.oscControlGroupTitle}>Horizontal / Trigger</div>
          <LabeledSlider label="Time/Div" value={timebase} min={0.1} max={5} step={0.1} onChange={onTimebaseChange} unit="x" />
          <LabeledSlider label="Trig Level" value={triggerLevel} min={-100} max={100} step={1} onChange={onTriggerLevelChange} unit=" mV" />
          <LabeledSlider label="Thickness" value={thickness} min={1} max={5} step={0.5} onChange={onThicknessChange} unit=" px" />
        </div>

        <div data-part={P.oscControlGroup} style={{ opacity: channel2 ? 1 : 0.7 }}>
          <div
            data-part={P.oscControlGroupTitle}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>CH2 (Sine)</span>
            <Checkbox checked={channel2} onChange={() => onChannel2Change(!channel2)} label="ON" />
          </div>
          {channel2 && (
            <>
              <LabeledSlider label="Frequency" value={ch2Freq} min={0.1} max={20} step={0.1} onChange={onCh2FreqChange} unit=" Hz" />
              <LabeledSlider label="Amplitude" value={ch2Amp} min={0} max={140} step={1} onChange={onCh2AmpChange} unit="%" />
            </>
          )}
        </div>
      </div>

      <WidgetToolbar>
        <Btn onClick={() => onRunningChange(!running)} style={{ fontSize: 10 }}>
          {running ? '⏸ Stop' : '▶ Run'}
        </Btn>
        <Btn onClick={onResetTime} style={{ fontSize: 10 }}>
          ⏮ Reset
        </Btn>
        <Btn onClick={onResetDefaults} style={{ fontSize: 10 }}>
          Defaults
        </Btn>
        <Separator />
        <Checkbox checked={showGrid} onChange={() => onShowGridChange(!showGrid)} label="Grid" />
        <Checkbox checked={showCrosshair} onChange={() => onShowCrosshairChange(!showCrosshair)} label="Cursor" />
        <Checkbox checked={phosphor} onChange={() => onPhosphorChange(!phosphor)} label="Phosphor" />
      </WidgetToolbar>
    </>
  );
}
