import { interval } from 'rxjs';
import { scan } from 'rxjs/operators/';

enum HWState {
    HIGH,
    LOW,
    Z,
}

const { HIGH, LOW, Z } = HWState

class HWSignal {
    state: HWState = Z
    ident: string = ""

    constructor(ident: string) {
        this.ident = ident
    }

    getState(): string {
        switch(this.state) {
            case Z: return "Z"
            case HIGH: return "HIGH"
            case LOW: return "LOW"
        }
    }

    print(): void {
        console.log(this.ident, ": ", this.getState())
    }
}

type SignalMap = Map<string, HWSignal>

class HWComponent {
    inputs: SignalMap
    outputs: SignalMap

    constructor(inputs: Array<string>, outputs: Array<string>) {
        const toMap = (sm: SignalMap, v: string) => sm.set(v, new HWSignal(v))
        this.inputs = inputs.reduce(toMap, new Map())
        this.outputs = outputs.reduce(toMap, new Map())
    }

    print(): void {
        const print = (v) => v.print()
        console.log("Inputs: ")
        this.inputs.forEach(print)
        console.log("Outputs: ")
        this.outputs.forEach(print)
    }

    expression(): void {}
}

export default class HWServer {
    connect(): void {

    }
}
