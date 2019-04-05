import splitIntoTriads = require('Controls/Utils/splitIntoTriads');

import ICallback from 'Controls/_input/InputCallback/ICallback';

const charOfIntegerPart: RegExp = /[-0-9]/;

function getCountTriads(valueLength: number): number {
    return Math.max(0, Math.floor((valueLength - 1) / 3));
}

export default function lengthConstraint(maxLength: number, useGrouping: boolean): ICallback<number> {
    return (data) => {
        let formattedDisplayValue: string = '';
        let relativePosition: number = data.position;
        let dotPosition: number = data.displayValue.length;

        for (let i = 0; i < data.displayValue.length; i++) {
            const char = data.displayValue[i];

            if (charOfIntegerPart.test(char)) {
                formattedDisplayValue += char;
            } else if (i < data.position) {
                relativePosition--;
            } else if (char === '.') {
                dotPosition = i;
                break;
            }
        }

        const needlessChars = Math.max(0, formattedDisplayValue.length - maxLength);

        if (needlessChars) {
            const removePosition = formattedDisplayValue.length - needlessChars;

            formattedDisplayValue = formattedDisplayValue.substring(0, removePosition);

            if (removePosition <= relativePosition && relativePosition <= formattedDisplayValue.length) {
                relativePosition = removePosition;
            } else if (formattedDisplayValue.length < relativePosition) {
                relativePosition -= needlessChars;
            }
        }

        if (useGrouping) {
            const countTriads = getCountTriads(formattedDisplayValue.length);
            const countTriadsAfterCarriage = getCountTriads(formattedDisplayValue.length - relativePosition);

            formattedDisplayValue = splitIntoTriads(formattedDisplayValue);
            relativePosition += countTriads - countTriadsAfterCarriage;
        }

        formattedDisplayValue += data.displayValue.substring(dotPosition);

        return {
            position: relativePosition,
            displayValue: formattedDisplayValue
        };
    };
}
