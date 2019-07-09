import Base = require('Controls/_input/Base');

import {descriptor, TimeInterval} from 'Types/entity';
import {IOptions as IModelOptions, ViewModel} from 'Controls/_input/TimeInterval/ViewModel';

type IOptions = IModelOptions;

/**
 * Controls that allows user to enter some amount of time with the accuracy from day to seconds.
 * <a href="/materials/demo-ws4-input-timeinterval">Demo examples.</a>.
 *
 * @class Controls/_input/TimeInterval
 * @extends Controls/_input/Base
 *
 * @mixes Controls/interface/IInputBase
 * @mixes Controls/interface/ITimeInterval
 *
 * @public
 * @demo Controls-demo/Input/TimeInterval/TimeIntervalPG
 *
 * @author Красильников А.С.
 */

class TimeInterval extends Base {
    protected _defaultValue: TimeInterval | null = null;

    protected _getViewModelOptions(options: IOptions): IModelOptions {
        return {
            mask: options.mask
        };
    }

    protected _getViewModelConstructor() {
        return ViewModel;
    }

    protected _initProperties() {
        super._initProperties();
        this._field.scope._useStretcher = true;
    }

    protected _changeHandler() {
        if (this._viewModel.autoComplete()) {
            this._notifyValueChanged();
        }

        super._changeHandler();
    }

    static getDefaultOptions(): object {
        const defaultOptions = Base.getDefaultOptions();

        return defaultOptions;
    }

    static getOptionTypes(): object {
        const optionTypes = Base.getOptionTypes();

        /**
         * TODO: Uncomment after execution.
         * https://online.sbis.ru/opendoc.html?guid=8b36a045-d4f7-4d73-9d92-de4f190a65da
         * optionTypes.value = descriptor(Object, null);
         */

        optionTypes.mask = descriptor(String).oneOf([
            'HH:MM',
            'HHH:MM',
            'HHHH:MM',
            'HH:MM:SS',
            'HHH:MM:SS',
            'HHHH:MM:SS'
        ]).required();

        return optionTypes;
    }
}

export default TimeInterval;
