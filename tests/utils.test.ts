import {test} from "@jest/globals";
import {isNumber, timeSince} from '../src/utils.js';

test('time since 1 hour ago', () => {
    const timestamp = 1601841600 * 1000; // 2020-10-04 20:00
    const timestampSince = 1601845200 * 1000; // 2020-10-04 21:00

    const result = timeSince(timestamp, timestampSince);

    expect(result).toBe('1h');
});

test('time since 10 minutes ago', () => {
    const timestamp = 1601844600 * 1000; // 2020-10-04 20:50
    const timestampSince = 1601845200 * 1000; // 2020-10-04 21:00

    const result = timeSince(timestamp, timestampSince);

    expect(result).toBe('10m');
});

test('time since 30 seconds ago', () => {
    const timestamp = 1601845170 * 1000; // 2020-10-04 20:59:30
    const timestampSince = 1601845200 * 1000; // 2020-10-04 21:00

    const result = timeSince(timestamp, timestampSince);

    expect(result).toBe('30s');
});

test('is a number', () => {
    expect(isNumber(1)).toBeTruthy();
    expect(isNumber(100)).toBeTruthy();
    expect(isNumber('100')).toBeTruthy();
    expect(isNumber('a')).toBeFalsy();
    expect(isNumber(undefined)).toBeFalsy();
});