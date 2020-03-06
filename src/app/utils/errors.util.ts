export function expectNotNullFn<T>(value: T, msgProvider: () => string): T {
    if (value == null) {
        throw new Error(msgProvider ? msgProvider() : 'expected a non-null value');
    }
    return value;
}

export function expectNotNull<T>(value: T, msg?: string): T {
    if (value == null) {
        throw new Error(msg ? msg : 'expected a non-null value');
    }
    return value;
}

export function preconditionFn(expression: boolean, msgProvider: () => string) {
    if (!expression) {
        throw new Error(msgProvider ? msgProvider() : 'Precondition failed');
    }
}

export function precondition(expression: boolean, msg?: string) {
    if (!expression) {
        throw new Error(msg ? msg : 'Precondition failed');
    }
}
