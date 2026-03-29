import { describe, expect, it } from 'vitest';
import { mapRealtimeEventFromProto, mapSubmitResponseToProto, mapUIRequestFromProto } from './confirmProtoAdapter';
import type { ConfirmRequest } from '../types';

describe('confirmProtoAdapter', () => {
  it('maps protojson UIRequest into runtime request', () => {
    const request = mapUIRequestFromProto({
      id: 'req-1',
      type: 'confirm',
      sessionId: 'global',
      confirmInput: {
        title: 'Deploy now?',
        message: 'Release 1.2.3',
      },
      status: 'pending',
    });

    expect(request).not.toBeNull();
    expect(request?.widgetType).toBe('confirm');
    expect(request?.title).toBe('Deploy now?');
    expect(request?.input?.payload?.title).toBe('Deploy now?');
    expect(request?.status).toBe('pending');
  });

  it('maps websocket event with embedded request', () => {
    const event = mapRealtimeEventFromProto({
      type: 'new_request',
      request: {
        id: 'req-2',
        type: 'select',
        sessionId: 'global',
        selectInput: {
          title: 'Pick env',
          options: ['staging', 'prod'],
        },
        status: 'pending',
      },
    });

    expect(event).not.toBeNull();
    expect(event?.type).toBe('new_request');
    expect(event?.request?.widgetType).toBe('select');
  });

  it('maps timeout and error statuses from proto request payloads', () => {
    const timeout = mapUIRequestFromProto({
      id: 'req-timeout',
      type: 'confirm',
      sessionId: 'global',
      status: 'timeout',
      confirmInput: { title: 't', message: 'm' },
    });
    const error = mapUIRequestFromProto({
      id: 'req-error',
      type: 'confirm',
      sessionId: 'global',
      status: 'error',
      confirmInput: { title: 't', message: 'm' },
    });
    const legacyExpired = mapUIRequestFromProto({
      id: 'req-expired',
      type: 'confirm',
      sessionId: 'global',
      status: 'expired',
      confirmInput: { title: 't', message: 'm' },
    });

    expect(timeout?.status).toBe('timeout');
    expect(error?.status).toBe('error');
    expect(legacyExpired?.status).toBe('timeout');
  });

  it('maps completion output payload from request_completed websocket events', () => {
    const event = mapRealtimeEventFromProto({
      type: 'request_completed',
      request: {
        id: 'req-complete-1',
        type: 'confirm',
        sessionId: 'global',
        status: 'completed',
        completedAt: '2026-02-24T00:00:00Z',
        confirmInput: {
          title: 'Deploy now?',
          message: 'Release 1.2.3',
        },
        confirmOutput: {
          approved: true,
          timestamp: '2026-02-24T00:00:00Z',
          comment: 'ship it',
        },
      },
    });

    expect(event).not.toBeNull();
    expect(event?.type).toBe('request_completed');
    expect(event?.requestId).toBe('req-complete-1');
    expect(event?.output).toEqual({
      approved: true,
      timestamp: '2026-02-24T00:00:00Z',
      comment: 'ship it',
    });
  });

  it('maps script view step metadata and preserves non-core script widget types', () => {
    const request = mapUIRequestFromProto({
      id: 'req-script-1',
      type: 'script',
      sessionId: 'global',
      scriptInput: {
        source: 'module.exports = {}',
      },
      scriptView: {
        widgetType: 'rating',
        stepId: 'rate-step',
        title: 'Rate this run',
        description: 'Provide a score',
        input: {
          title: 'How was it?',
          scale: 5,
        },
      },
    });

    expect(request).not.toBeNull();
    expect(request?.widgetType).toBe('script');
    expect(request?.scriptView?.widgetType).toBe('rating');
    expect(request?.scriptView?.stepId).toBe('rate-step');
    expect(request?.title).toBe('Rate this run');
  });

  it('encodes confirm response into proto oneof payload', () => {
    const request: ConfirmRequest = {
      id: 'req-3',
      sessionId: 'global',
      widgetType: 'confirm',
      input: { payload: {} },
    };

    const payload = mapSubmitResponseToProto(request, {
      output: { approved: true, comment: 'ship it' },
    });

    expect(payload).toEqual({
      confirmOutput: {
        approved: true,
        timestamp: expect.any(String),
        comment: 'ship it',
      },
    });
  });

  it('encodes select multi response into proto oneof payload', () => {
    const request: ConfirmRequest = {
      id: 'req-4',
      sessionId: 'global',
      widgetType: 'select',
      input: { payload: { multi: true } },
    };

    const payload = mapSubmitResponseToProto(request, {
      output: { selectedIds: ['staging', 'prod'] },
    });

    expect(payload).toEqual({
      selectOutput: {
        selectedMulti: {
          values: ['staging', 'prod'],
        },
      },
    });
  });

  it('encodes select multi mode with single selection as selectedMulti', () => {
    const request: ConfirmRequest = {
      id: 'req-4b',
      sessionId: 'global',
      widgetType: 'select',
      input: { payload: { multi: true } },
    };

    const payload = mapSubmitResponseToProto(request, {
      output: { selectedIds: ['staging'] },
    });

    expect(payload).toEqual({
      selectOutput: {
        selectedMulti: {
          values: ['staging'],
        },
      },
    });
  });

  it('encodes table multi mode with single selected row as selectedMulti', () => {
    const request: ConfirmRequest = {
      id: 'req-4c',
      sessionId: 'global',
      widgetType: 'table',
      input: { payload: { multiSelect: true } },
    };

    const payload = mapSubmitResponseToProto(request, {
      output: {
        selectedRows: [{ id: 'srv-1', env: 'staging', status: 'ok' }],
      },
    });

    expect(payload).toEqual({
      tableOutput: {
        selectedMulti: {
          values: [{ id: 'srv-1', env: 'staging', status: 'ok' }],
        },
      },
    });
  });

  it('encodes image multi mode with single selected id as selectedStrings', () => {
    const request: ConfirmRequest = {
      id: 'req-4d',
      sessionId: 'global',
      widgetType: 'image',
      input: { payload: { multi: true } },
    };

    const payload = mapSubmitResponseToProto(request, {
      output: { selectedImageIds: ['img-1'] },
    });

    expect(payload).toEqual({
      imageOutput: {
        selectedStrings: { values: ['img-1'] },
        timestamp: expect.any(String),
      },
    });
  });

  it('normalizes upload maxSize protojson string into number', () => {
    const request = mapUIRequestFromProto({
      id: 'req-upload-1',
      type: 'upload',
      sessionId: 'global',
      uploadInput: {
        title: 'Attach logs',
        maxSize: '10485760',
      },
      status: 'pending',
    });

    expect(request).not.toBeNull();
    expect(request?.widgetType).toBe('upload');
    expect(request?.input?.payload?.maxSize).toBe(10485760);
  });

  it('encodes image confirm response into proto oneof payload', () => {
    const request: ConfirmRequest = {
      id: 'req-5',
      sessionId: 'global',
      widgetType: 'image',
      input: { payload: {} },
    };

    const payload = mapSubmitResponseToProto(request, {
      output: { selectedBool: true, comment: 'approved' },
    });

    expect(payload).toEqual({
      imageOutput: {
        selectedBool: true,
        timestamp: expect.any(String),
        comment: 'approved',
      },
    });
  });
});
