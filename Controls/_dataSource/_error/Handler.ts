/// <amd-module name="Controls/_dataSource/_error/Handler" />
import Mode from 'Controls/_dataSource/_error/Mode';
import {
    ViewConfig as ParkingViewConfig
} from 'Controls/_dataSource/_parking/Handler';

/**
 * Возвращаемый обработчиком ошибки результат
 * @typedef {Object}
 * @name Controls/_dataSource/_error/ViewConfig
 * @property {String} template Шаблон отображения ошибки
 * @property {Object} [options] параметры построяния шаблона ошибки
 * @property {Controls/_dataSource/_error/Mode} [mode]
 */
export type ViewConfig<TOptions = object> = ParkingViewConfig<TOptions> & {
    mode?: Mode;
}

/**
 * Передаваемые в обработчик параметры
 * @typedef {Object}
 * @name Controls/_dataSource/_error/HandlerConfig
 * @property {Controls/_dataSource/_error/Mode} mode Способ отображения ошибки (на всё окно / диалог / внутри компонента)
 * @property {Error} Обрабатываемая ошибка
 */
export type HandlerConfig<T extends Error = Error> = {
    error: T | Error;
    mode: Mode;
}

/**
 * Обработчик ошибки
 * @typedef {Function}
 * @name Controls/_dataSource/_error/Handler
 * @param {HandlerConfig} объект с параметрами
 * @return {void | Controls/_dataSource/_error/ViewConfig}
 */
export type Handler<
    TError extends Error = Error,
    TOptions = object
> = (config: HandlerConfig<TError>) => ViewConfig<TOptions> | void;
