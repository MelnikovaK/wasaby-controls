import Base = require('Controls/_input/Base');
import readOnlyFieldTemplate = require('wml!Controls/_input/Money/ReadOnly');

import {descriptor} from 'Types/entity';
import ViewModel from 'Controls/_input/Money/ViewModel';

/**
 * Поле ввода денег.
 * <a href="/materials/demo-ws4-input">Демо-пример</a>.
 *
 * @class Controls/_input/Money
 * @extends Controls/_input/Base
 *
 * @mixes Controls/interface/IInputBase
 * @mixes Controls/interface/IOnlyPositive
 *
 * @public
 * @demo Controls-demo/Input/SizesAndHeights/Index
 * @demo Controls-demo/Input/FontStyles/Index
 * @demo Controls-demo/Input/TextAlignments/Index
 * @demo Controls-demo/Input/TagStyles/Index
 * @demo Controls-demo/Input/ValidationStatuses/Index
 * @demo Controls-demo/Input/Placeholders/Index
 *
 * @author Красильников А.С.
 */

/*
 * Input for entering currency.
 * <a href="/materials/demo-ws4-input">Demo examples.</a>.
 *
 * @class Controls/_input/Money
 * @extends Controls/_input/Base
 *
 * @mixes Controls/interface/IInputBase
 * @mixes Controls/interface/IOnlyPositive
 *
 * @public
 * @demo Controls-demo/Input/Money/Money
 *
 * @author Красильников А.С.
 */

class Money extends Base {
    protected _initProperties(): void {
        super._initProperties();

        this._readOnlyField.template = readOnlyFieldTemplate;
        this._readOnlyField.scope.integerPart = Money.integerPart;
        this._readOnlyField.scope.fractionPart = Money.fractionPart;
    }

    protected _getViewModelOptions(options) {
        return {
            useGrouping: true,
            showEmptyDecimals: true,
            precision: Money.PRECISION,
            useAdditionToMaxPrecision: true,
            onlyPositive: options.onlyPositive
        };
    }

    protected _getViewModelConstructor() {
        return ViewModel;
    }

    private static PRECISION: number = 2;

    private static calcStartFractionPart(value: string): number {
        const splitterLength = 1;

        return value.length - Money.PRECISION - splitterLength;
    }

    private static integerPart(value: string): string {
        return value.substring(0, Money.calcStartFractionPart(value));
    }

    private static fractionPart(value: string): string {
        return value.substring(Money.calcStartFractionPart(value));
    }

    static getDefaultOptions() {
        const defaultOptions = Base.getDefaultOptions();

        defaultOptions.onlyPositive = false;

        return defaultOptions;
    }

    static getOptionTypes() {
        const optionTypes = Base.getOptionTypes();

        optionTypes.onlyPositive = descriptor(Boolean);

        return optionTypes;
    }
}

export default Money;
