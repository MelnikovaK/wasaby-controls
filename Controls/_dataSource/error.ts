/// <amd-module name="Controls/_dataSource/error" />
/**
 * Набор модулей необходимых для обработки и отображения ошибок
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ui-library/handling-errors/}
 * @library Controls/_dataSource/error
 * @includes Controller Controls/_dataSource/_error/Controller
 * @includes Container Controls/_dataSource/_error/Container
 * @includes DataLoader Controls/_dataSource/_error/DataLoader
 * @includes Mode Controls/_dataSource/_error/Mode
 * @includes Handler Controls/_dataSource/_error/Handler
 * @includes ViewConfig Controls/_dataSource/_error/ViewConfig
 * @includes IContainer Controls/_dataSource/_error/IContainer
 * @includes IContainerConfig Controls/_dataSource/_error/IContainer.IContainerConfig
 * @includes IContainerConstructor Controls/_dataSource/_error/IContainer.IContainerConstructor
 * @public
 * @author Заляев А.В.
 */

export {
    Handler,
    ViewConfig,
    HandlerConfig
} from 'Controls/_dataSource/_error/Handler';
export { default as Controller, Config } from 'Controls/_dataSource/_error/Controller';
export { default as Mode } from 'Controls/_dataSource/_error/Mode';
export { default as Container } from 'Controls/_dataSource/_error/Container';
export { default as DataLoader } from 'Controls/_dataSource/_error/DataLoader';
export {
    default as IContainer,
    IContainerConfig,
    IContainerConstructor
} from 'Controls/_dataSource/_error/IContainer';
