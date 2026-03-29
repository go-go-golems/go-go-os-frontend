import { Btn } from '@go-go-golems/os-core';
import { RICH_PARTS as P } from '../parts';
import { ModalOverlay } from '../primitives/ModalOverlay';
import type { BlockInstance } from './types';

export function ParamsDialog({
  block,
  onClose,
}: {
  block: BlockInstance;
  onClose: () => void;
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <div data-part={P.smDialog}>
        <div data-part={P.smDialogHeader}>
          {block.emoji} {block.label} Parameters
        </div>
        <div data-part={P.smDialogBody}>
          <div data-part={P.smParamInfo}>
            <div>Block: <b>{block.label}</b></div>
            <div>Type: {block.type}</div>
            <div>Ports: {block.inputs} in / {block.outputs} out</div>
          </div>
          {block.type === 'gain' && (
            <div data-part={P.smParamRow}>
              <span>Gain:</span>
              <input data-part="field-input" defaultValue="1.0" style={{ width: 80 }} />
            </div>
          )}
          {block.type === 'source' && (
            <>
              <div data-part={P.smParamRow}>
                <span>Amplitude:</span>
                <input data-part="field-input" defaultValue="1.0" style={{ width: 60 }} />
              </div>
              <div data-part={P.smParamRow}>
                <span>Frequency:</span>
                <input data-part="field-input" defaultValue="1.0" style={{ width: 60 }} />
                <span>rad/s</span>
              </div>
            </>
          )}
          {block.type === 'constant' && (
            <div data-part={P.smParamRow}>
              <span>Value:</span>
              <input data-part="field-input" defaultValue="1.0" style={{ width: 80 }} />
            </div>
          )}
          {block.type === 'delay' && (
            <div data-part={P.smParamRow}>
              <span>Delay:</span>
              <input data-part="field-input" defaultValue="0.1" style={{ width: 60 }} />
              <span>sec</span>
            </div>
          )}
          <div data-part={P.smDialogActions}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn onClick={onClose}>OK</Btn>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

export function SimParamsDialog({
  simTime,
  onSimTimeChange,
  onClose,
}: {
  simTime: string;
  onSimTimeChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <div data-part={P.smDialog}>
        <div data-part={P.smDialogHeader}>Simulation Parameters</div>
        <div data-part={P.smDialogBody}>
          <div data-part={P.smParamRow}>
            <span>Stop Time:</span>
            <input
              data-part="field-input"
              value={simTime}
              onChange={(event) => onSimTimeChange(event.target.value)}
              style={{ width: 80 }}
            />
            <span>sec</span>
          </div>
          <div data-part={P.smParamRow}>
            <span>Solver:</span>
            <select data-part="field-input">
              <option>ode45 (Dormand-Prince)</option>
              <option>ode23 (Bogacki-Shampine)</option>
              <option>ode15s (Stiff/NDF)</option>
              <option>Euler (Fixed Step)</option>
            </select>
          </div>
          <div data-part={P.smParamRow}>
            <span>Max Step:</span>
            <input data-part="field-input" defaultValue="auto" style={{ width: 80 }} />
          </div>
          <div data-part={P.smDialogActions}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn onClick={onClose}>OK</Btn>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
