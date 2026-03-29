import { Btn, Checkbox } from '@go-go-golems/os-core';
import { RICH_PARTS as P } from '../parts';
import { LabeledSlider } from '../primitives/LabeledSlider';
import { WidgetToolbar } from '../primitives/WidgetToolbar';
import { Separator } from '../primitives/Separator';
import { CHANNEL_NAMES, PROTOCOLS, type Channel, type Protocol, type TriggerEdge } from './types';

export function LogicAnalyzerControls({
  channels,
  speed,
  zoom,
  showGrid,
  showEdges,
  protocol,
  triggerCh,
  triggerEdge,
  busView,
  running,
  onToggleChannel,
  onSpeedChange,
  onZoomChange,
  onShowGridChange,
  onShowEdgesChange,
  onProtocolChange,
  onTriggerChChange,
  onTriggerEdgeChange,
  onBusViewChange,
  onToggleRunning,
  onResetTime,
  onResetDefaults,
}: {
  channels: Channel[];
  speed: number;
  zoom: number;
  showGrid: boolean;
  showEdges: boolean;
  protocol: Protocol;
  triggerCh: number;
  triggerEdge: TriggerEdge;
  busView: boolean;
  running: boolean;
  onToggleChannel: (index: number) => void;
  onSpeedChange: (value: number) => void;
  onZoomChange: (value: number) => void;
  onShowGridChange: (value: boolean) => void;
  onShowEdgesChange: (value: boolean) => void;
  onProtocolChange: (value: Protocol) => void;
  onTriggerChChange: (value: number) => void;
  onTriggerEdgeChange: (value: TriggerEdge) => void;
  onBusViewChange: (value: boolean) => void;
  onToggleRunning: () => void;
  onResetTime: () => void;
  onResetDefaults: () => void;
}) {
  return (
    <>
      <div data-part={P.laControls}>
        <div data-part={P.laControlGroup}>
          <div data-part={P.laControlGroupTitle}>Channels</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {channels.map((channel, index) => (
              <div
                key={channel.name}
                data-part={P.laChannelRow}
                style={{ opacity: channel.enabled ? 1 : 0.4 }}
              >
                <Checkbox
                  checked={channel.enabled}
                  onChange={() => onToggleChannel(index)}
                  label=""
                />
                <span data-part={P.laChannelColor} style={{ background: channel.color }} />
                <span style={{ fontSize: 9, fontWeight: 'bold' }}>{channel.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div data-part={P.laControlGroup}>
          <div data-part={P.laControlGroupTitle}>Timing</div>
          <LabeledSlider
            label="Speed"
            value={speed}
            min={0.1}
            max={5}
            step={0.1}
            onChange={onSpeedChange}
            unit="x"
          />
          <LabeledSlider
            label="Zoom"
            value={zoom}
            min={0.2}
            max={4}
            step={0.1}
            onChange={onZoomChange}
            unit="x"
          />
        </div>

        <div data-part={P.laControlGroup}>
          <div data-part={P.laControlGroupTitle}>Trigger</div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 4, flexWrap: 'wrap' }}>
            {CHANNEL_NAMES.slice(0, 6).map((name, index) => (
              <Btn
                key={name}
                onClick={() => onTriggerChChange(index)}
                data-state={triggerCh === index ? 'active' : undefined}
                style={{ fontSize: 9, padding: '2px 6px' }}
              >
                {name}
              </Btn>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn
              onClick={() => onTriggerEdgeChange('rising')}
              data-state={triggerEdge === 'rising' ? 'active' : undefined}
              style={{ fontSize: 9, padding: '2px 6px' }}
            >
              ↑ Rising
            </Btn>
            <Btn
              onClick={() => onTriggerEdgeChange('falling')}
              data-state={triggerEdge === 'falling' ? 'active' : undefined}
              style={{ fontSize: 9, padding: '2px 6px' }}
            >
              ↓ Falling
            </Btn>
          </div>
        </div>

        <div data-part={P.laControlGroup}>
          <div data-part={P.laControlGroupTitle}>Protocol Decode</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {PROTOCOLS.map((protocolName) => (
              <Btn
                key={protocolName}
                onClick={() => onProtocolChange(protocolName)}
                data-state={protocol === protocolName ? 'active' : undefined}
                style={{ fontSize: 9, padding: '2px 6px' }}
              >
                {protocolName}
              </Btn>
            ))}
          </div>
        </div>

        <div data-part={P.laControlGroup}>
          <div data-part={P.laControlGroupTitle}>Display</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Checkbox checked={showGrid} onChange={() => onShowGridChange(!showGrid)} label="Grid" />
            <Checkbox
              checked={showEdges}
              onChange={() => onShowEdgesChange(!showEdges)}
              label="Edge Markers"
            />
            <Checkbox
              checked={busView}
              onChange={() => onBusViewChange(!busView)}
              label="Bus Hex View"
            />
          </div>
        </div>
      </div>

      <WidgetToolbar>
        <Btn onClick={onToggleRunning} style={{ fontSize: 10 }}>
          {running ? '⏸ Stop' : '▶ Capture'}
        </Btn>
        <Btn onClick={onResetTime} style={{ fontSize: 10 }}>
          ⏮ Reset
        </Btn>
        <Btn onClick={onResetDefaults} style={{ fontSize: 10 }}>
          Defaults
        </Btn>
        <Separator />
        <Checkbox checked={showGrid} onChange={() => onShowGridChange(!showGrid)} label="Grid" />
        <Checkbox checked={showEdges} onChange={() => onShowEdgesChange(!showEdges)} label="Edges" />
        <Checkbox checked={busView} onChange={() => onBusViewChange(!busView)} label="Bus" />
      </WidgetToolbar>
    </>
  );
}
